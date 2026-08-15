import { describe, expect, it } from 'vitest';
import { preparedFilename } from './download.js';

describe('preparedFilename', () => {
  it('keeps the original stem so a folder of these is still navigable', () => {
    expect(preparedFilename('IMG_20260814_113355.jpg', 'image/png', 'pristine-')).toBe(
      'pristine-IMG_20260814_113355.png',
    );
  });

  /**
   * The extension follows the blob, not the source. What is saved today is a
   * lossless render of a photo, and after the experiment it may be a video.
   */
  it('takes the extension from the blob type rather than the source', () => {
    expect(preparedFilename('clip.mov', 'video/mp4', 'pristine-')).toBe('pristine-clip.mp4');
    expect(preparedFilename('shot.heic', 'image/jpeg', 'pristine-')).toBe('pristine-shot.jpg');
  });

  it('strips what a file system would object to, and does not leave a dangling separator', () => {
    expect(preparedFilename('holiday photo (1).jpg', 'image/png', 'pristine-')).toBe(
      'pristine-holiday-photo-1.png',
    );
    expect(preparedFilename('../../etc/passwd.jpg', 'image/png', 'pristine-')).toBe(
      'pristine-etc-passwd.png',
    );
  });

  it('still produces a name when there is nothing usable left', () => {
    expect(preparedFilename('.jpg', 'image/png', 'pristine-')).toBe('pristine-status.png');
    expect(preparedFilename('***.jpg', 'image/png', 'pristine-')).toBe('pristine-status.png');
  });

  /** An unknown type is saved with a neutral extension, not a wrong one. */
  it('does not guess an extension it does not know', () => {
    expect(preparedFilename('thing.jpg', 'application/octet-stream', 'pristine-')).toBe(
      'pristine-thing.bin',
    );
  });
});
