import { useCallback, useEffect, useRef, useState } from 'react';
import type { FitMode } from '@pristine/encoder';
import { isLyingDown, renderToStatusFrame } from '@pristine/encoder';
import { surface } from '@pristine/tokens';
import { readPickedFile, type AcceptedMedia, type MediaRejection } from './media.js';
import type { ChosenFile } from './screens/EntryScreen.js';

/**
 * Owns picking a file, reading it, and rendering it into the Status frame.
 *
 * Kept out of App so the flow component stays a switch over screens. The render
 * itself lives in @pristine/encoder, because it is the frame the pipeline will
 * encode and the experiment scores against, not a preview a screen invented.
 */

export interface PickedMedia {
  readonly chosen: ChosenFile;
  readonly media: AcceptedMedia;
  /** Object URL of the Status render at the current fit. */
  readonly renderUrl: string;
  /**
   * The render itself, for saving and for storing.
   *
   * Kept alongside the URL rather than fetched back out of it. Reading a blob
   * URL to recover the blob works, but it is a request for something already
   * in memory, and it fails silently once the URL has been revoked.
   */
  readonly renderBlob: Blob;
}

export interface MediaPicker {
  readonly picked: PickedMedia | undefined;
  readonly rejection: MediaRejection | undefined;
  /** Opens the OS picker. */
  readonly browse: () => void;
  readonly clear: () => void;
  readonly dismissRejection: () => void;
  /** Props for the hidden input the screen has to mount. */
  readonly inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    readonly ref: React.RefObject<HTMLInputElement>;
  };
}

/** How much room the browser says is left, when it will say. */
async function availableBytes(): Promise<number | undefined> {
  if (typeof navigator === 'undefined' || navigator.storage?.estimate === undefined) {
    return undefined;
  }
  const { quota, usage } = await navigator.storage.estimate();
  return quota === undefined ? undefined : quota - (usage ?? 0);
}

export function useMediaPicker(fit: FitMode): MediaPicker {
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<AcceptedMedia | undefined>(undefined);
  const [picked, setPicked] = useState<PickedMedia | undefined>(undefined);
  const [rejection, setRejection] = useState<MediaRejection | undefined>(undefined);

  const browse = useCallback(() => inputRef.current?.click(), []);

  const clear = useCallback(() => {
    setMedia(undefined);
    setPicked(undefined);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const onChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = '';
    if (!file) return;

    const result = await readPickedFile(file, { availableBytes: await availableBytes() });
    if (!result.ok) {
      setRejection(result.reason);
      return;
    }
    setRejection(undefined);
    setMedia(result.media);
  }, []);

  // Re-renders whenever the media or the fit changes, so toggling fit and crop
  // shows the real difference rather than a CSS approximation of it.
  useEffect(() => {
    if (media === undefined) {
      setPicked(undefined);
      return undefined;
    }

    let url: string | undefined;
    let cancelled = false;

    void (async () => {
      const source =
        media.kind === 'image' ? await createImageBitmap(media.file) : await videoFrame(media.file);

      const canvas = document.createElement('canvas');
      renderToStatusFrame(source, canvas, { fit, backdrop: surface.media });
      if ('close' in source) source.close();

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (cancelled || blob === null) return;

      url = URL.createObjectURL(blob);
      setPicked({
        media,
        renderUrl: url,
        renderBlob: blob,
        chosen: {
          name: media.file.name,
          width: media.dimensions.width,
          height: media.dimensions.height,
          bytes: media.bytes,
          lyingDown: isLyingDown(media.dimensions),
        },
      });
    })();

    return () => {
      cancelled = true;
      // Object URLs are not collected on their own, and a 12MP render held by a
      // dead URL is real memory on a 4GB phone.
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [media, fit]);

  return {
    picked,
    rejection,
    browse,
    clear,
    dismissRejection: useCallback(() => setRejection(undefined), []),
    inputProps: {
      ref: inputRef,
      type: 'file',
      // No capture attribute: it forces the camera and takes away the gallery,
      // which is the opposite of what this screen is for.
      accept: 'image/*,video/*',
      hidden: true,
      onChange: (event) => void onChange(event),
    },
  };
}

/** Grabs the first frame of a video, for the preview. */
function videoFrame(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.onloadeddata = () => {
      URL.revokeObjectURL(url);
      resolve(video);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not decode the video'));
    };
    video.src = url;
  });
}
