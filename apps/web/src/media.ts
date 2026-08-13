import { STATUS_MAX_BYTES } from '@pristine/encoder';
import type { Dimensions } from '@pristine/encoder';

/**
 * Reading what the OS file picker handed over.
 *
 * The browser tells us almost nothing for free: `File` carries a name, a size
 * and a MIME type that is sometimes wrong or empty. Dimensions have to be
 * decoded, and orientation has to be read out of EXIF, because a portrait phone
 * photo is very often stored landscape with a rotate flag. Trusting the stored
 * dimensions there would show the orientation card to everyone who took a
 * normal upright photo.
 */

/** Why a chosen file cannot be prepared. Each maps to a sheet that exists. */
export type MediaRejection = 'too-large' | 'unsupported-format' | 'low-storage';

export interface AcceptedMedia {
  readonly file: File;
  readonly kind: 'image' | 'video';
  /** Display dimensions, with EXIF orientation already applied. */
  readonly dimensions: Dimensions;
  readonly bytes: number;
  readonly durationSeconds?: number;
}

export type MediaResult =
  | { readonly ok: true; readonly media: AcceptedMedia }
  | { readonly ok: false; readonly reason: MediaRejection };

/**
 * Formats a browser cannot decode.
 *
 * HEIC is the one that matters: it is the iPhone default and Chrome on Android
 * will not touch it. The copy for this case is already written.
 */
const UNSUPPORTED = /\.(heic|heif|avif|jxl|dng|cr2|cr3|nef|arw|raf|orf|rw2)$/i;

const isUnsupported = (file: File): boolean =>
  UNSUPPORTED.test(file.name) || /image\/(heic|heif|avif)/i.test(file.type);

/**
 * EXIF orientations that swap width and height.
 *
 * 5 through 8 are the rotated-by-a-quarter-turn cases. The rest are upright or
 * mirrored, which do not change the aspect ratio.
 */
const SWAPS_AXES = new Set([5, 6, 7, 8]);

/**
 * Reads the EXIF orientation tag from a JPEG.
 *
 * Hand-rolled rather than pulled from a library: this is the only EXIF field
 * the app needs, and the whole read is a few dozen lines against a dependency
 * that would ship to users on a metered connection.
 *
 * Returns 1 (upright) when there is no tag, which is also what the spec says to
 * assume.
 */
export function readOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);
    // Not a marker any more, so there is nothing further worth reading.
    if ((marker & 0xff00) !== 0xff00) return 1;

    const size = view.getUint16(offset + 2, false);
    // APP1 is where EXIF lives.
    if (marker === 0xffe1) {
      const exif = offset + 4;
      if (exif + 10 > view.byteLength || view.getUint32(exif, false) !== 0x45786966) return 1;

      const tiff = exif + 6;
      // "II" little endian, "MM" big endian.
      const little = view.getUint16(tiff, false) === 0x4949;
      const dirOffset = view.getUint32(tiff + 4, little);
      const dir = tiff + dirOffset;
      if (dir + 2 > view.byteLength) return 1;

      const entries = view.getUint16(dir, little);
      for (let i = 0; i < entries; i += 1) {
        const entry = dir + 2 + i * 12;
        if (entry + 12 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          return view.getUint16(entry + 8, little) || 1;
        }
      }
      return 1;
    }

    if (size <= 0) return 1;
    offset += 2 + size;
  }
  return 1;
}

async function imageDimensions(file: File): Promise<Dimensions> {
  const [bitmap, head] = await Promise.all([
    createImageBitmap(file),
    // Orientation lives in the first few KB. Reading the whole file to find one
    // tag would stall on a 12MP photo for no reason.
    file.slice(0, 128 * 1024).arrayBuffer(),
  ]);

  try {
    const orientation = readOrientation(head);
    return SWAPS_AXES.has(orientation)
      ? { width: bitmap.height, height: bitmap.width }
      : { width: bitmap.width, height: bitmap.height };
  } finally {
    // Explicit, because the target device has 4GB and a decoded 12MP bitmap is
    // roughly 48MB that would otherwise wait for a collector.
    bitmap.close();
  }
}

function videoDimensions(file: File): Promise<Dimensions & { durationSeconds: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const done = (outcome: () => void) => {
      URL.revokeObjectURL(url);
      outcome();
    };

    video.onloadedmetadata = () =>
      done(() =>
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
        }),
      );
    video.onerror = () => done(() => reject(new Error('could not read the video')));
    video.src = url;
  });
}

export interface ReadOptions {
  /** Bytes currently free on the device, when the browser will say. */
  readonly availableBytes?: number | undefined;
}

/**
 * Turns a picked file into something the flow can work with, or the reason it
 * cannot.
 *
 * Every rejection maps to a sheet that already exists and already has copy.
 */
export async function readPickedFile(file: File, options: ReadOptions = {}): Promise<MediaResult> {
  if (isUnsupported(file)) return { ok: false, reason: 'unsupported-format' };
  // Checked before storage, because a file this size is refused whatever the
  // device has free: the limit is what the phone can hold decoded, twice.
  if (isTooLargeToPrepare(file.size)) return { ok: false, reason: 'too-large' };

  const kind = file.type.startsWith('video/') ? 'video' : 'image';

  // Preparing needs room for the original and the result at the same time, so
  // the check is against roughly twice the source, not the source alone.
  const { availableBytes } = options;
  if (availableBytes !== undefined && availableBytes > 0 && file.size * 2 > availableBytes) {
    return { ok: false, reason: 'low-storage' };
  }

  try {
    if (kind === 'video') {
      const { durationSeconds, ...dimensions } = await videoDimensions(file);
      return {
        ok: true,
        media: { file, kind, dimensions, bytes: file.size, durationSeconds },
      };
    }

    const dimensions = await imageDimensions(file);
    return { ok: true, media: { file, kind, dimensions, bytes: file.size } };
  } catch {
    // A decode failure and an unreadable format are the same thing to a user,
    // and the unsupported sheet is the one that offers a way forward.
    return { ok: false, reason: 'unsupported-format' };
  }
}

/**
 * Whether a source file is too big to prepare on a phone at all.
 *
 * Declared before `readPickedFile` uses it only in reading order; hoisting
 * makes the order here the readable one rather than the required one.
 */
export function isTooLargeToPrepare(bytes: number): boolean {
  // Not the Status ceiling, which is about the upload. This is about holding
  // the original and the render in memory at once on a 4GB device.
  return bytes > STATUS_MAX_BYTES * 8;
}
