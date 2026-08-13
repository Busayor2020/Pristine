import { describe, expect, it } from 'vitest';
import { isTooLargeToPrepare, readOrientation, readPickedFile } from './media.js';

/**
 * Builds a JPEG head carrying one EXIF orientation tag.
 *
 * Enough of the container to be parsed as a real file: SOI, an APP1 segment
 * with an Exif header, a TIFF header and a single IFD entry.
 */
function jpegWithOrientation(orientation: number, little = true): ArrayBuffer {
  const bytes: number[] = [0xff, 0xd8, 0xff, 0xe1];
  const body: number[] = [];

  // "Exif\0\0"
  body.push(0x45, 0x78, 0x69, 0x66, 0x00, 0x00);
  // TIFF header: byte order, magic 42, offset to first IFD.
  body.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]));
  body.push(...(little ? [0x2a, 0x00] : [0x00, 0x2a]));
  body.push(...(little ? [0x08, 0x00, 0x00, 0x00] : [0x00, 0x00, 0x00, 0x08]));
  // One entry.
  body.push(...(little ? [0x01, 0x00] : [0x00, 0x01]));
  // Tag 0x0112, type SHORT, count 1, value.
  body.push(...(little ? [0x12, 0x01] : [0x01, 0x12]));
  body.push(...(little ? [0x03, 0x00] : [0x00, 0x03]));
  body.push(...(little ? [0x01, 0x00, 0x00, 0x00] : [0x00, 0x00, 0x00, 0x01]));
  body.push(...(little ? [orientation, 0x00] : [0x00, orientation]));
  body.push(0x00, 0x00);

  const size = body.length + 2;
  bytes.push((size >> 8) & 0xff, size & 0xff, ...body);
  return new Uint8Array(bytes).buffer;
}

describe('readOrientation', () => {
  it('assumes upright when there is no EXIF, which is what the spec says', () => {
    expect(readOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).buffer)).toBe(1);
  });

  it('reads a little endian tag', () => {
    expect(readOrientation(jpegWithOrientation(6))).toBe(6);
  });

  it('reads a big endian tag', () => {
    expect(readOrientation(jpegWithOrientation(8, false))).toBe(8);
  });

  it('does not fall over on a truncated or empty file', () => {
    expect(readOrientation(new ArrayBuffer(0))).toBe(1);
    expect(readOrientation(new Uint8Array([0xff, 0xd8]).buffer)).toBe(1);
  });

  it('returns upright for something that is not a JPEG at all', () => {
    expect(readOrientation(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBe(1);
  });
});

const file = (name: string, type: string, size = 1024): File =>
  ({
    name,
    type,
    size,
    slice: () => ({ arrayBuffer: async () => new ArrayBuffer(0) }),
  }) as unknown as File;

describe('readPickedFile', () => {
  /**
   * The common case. HEIC is the iPhone default and Chrome on Android will not
   * decode it, so this is the rejection real users will hit most.
   */
  it('rejects HEIC by extension even when the type is empty', async () => {
    const result = await readPickedFile(file('IMG_0001.HEIC', ''));
    expect(result).toEqual({ ok: false, reason: 'unsupported-format' });
  });

  it('rejects the other formats a camera or phone might hand over', async () => {
    for (const name of ['a.heif', 'b.avif', 'c.dng', 'd.cr2', 'e.nef', 'f.jxl']) {
      const result = await readPickedFile(file(name, ''));
      expect(result, name).toEqual({ ok: false, reason: 'unsupported-format' });
    }
  });

  it('rejects by MIME type when the name gives nothing away', async () => {
    const result = await readPickedFile(file('download', 'image/heic'));
    expect(result).toEqual({ ok: false, reason: 'unsupported-format' });
  });

  /**
   * Preparing holds the original and the render at once, so the bar is roughly
   * twice the source rather than the source alone.
   */
  it('refuses when there is not room for the original and the result together', async () => {
    const result = await readPickedFile(file('big.jpg', 'image/jpeg', 600), {
      availableBytes: 1000,
    });
    expect(result).toEqual({ ok: false, reason: 'low-storage' });
  });

  it('proceeds when there is room', async () => {
    const result = await readPickedFile(file('ok.jpg', 'image/jpeg', 100), {
      availableBytes: 1_000_000,
    });
    // Decoding fails in this environment, which is its own rejection, but the
    // storage check must not be what stopped it.
    expect(result.ok === false && result.reason).not.toBe('low-storage');
  });

  it('does not guess when the browser will not report free space', async () => {
    const result = await readPickedFile(file('ok.jpg', 'image/jpeg', 10_000_000), {
      availableBytes: undefined,
    });
    expect(result.ok === false && result.reason).not.toBe('low-storage');
  });
});

describe('isTooLargeToPrepare', () => {
  it('allows anything that could plausibly reach Status', () => {
    expect(isTooLargeToPrepare(16 * 1024 * 1024)).toBe(false);
  });

  /** The limit is about memory on a 4GB phone, not about the upload. */
  it('refuses a file far past what a phone can hold twice over', () => {
    expect(isTooLargeToPrepare(1.4 * 1024 * 1024 * 1024)).toBe(true);
  });
});
