/**
 * Hands a file to the browser to save.
 *
 * There is no API that puts a file into a phone's gallery, and no API that
 * posts to Status. A download is the whole of what the platform offers, so it
 * has to work rather than be a button that looks like it does.
 *
 * The object URL is created and revoked around the click. Leaving it alive
 * pins the blob, and a Status frame is several megabytes on a phone that is
 * short of memory.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // Firefox needs the element in the document for a programmatic click to
    // count as a user-initiated download.
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    // Revoking in the same tick cancels the download in some browsers, so this
    // waits for the click to have been handled.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * A filename for the prepared render.
 *
 * Keeps the original stem so a library of these is still navigable, and
 * strips anything a file system would object to. The extension is decided by
 * the blob's type rather than assumed, because what gets saved today is the
 * lossless render and what gets saved after the experiment may not be.
 */
export function preparedFilename(original: string, type: string, prefix: string): string {
  const stem = original
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w-]+/g, '-')
    // A name that started or ended in punctuation would otherwise keep a
    // dangling separator, which reads as a mistake in a downloads list.
    .replace(/^-+|-+$/g, '');
  const extension = EXTENSIONS[type] ?? 'bin';
  return `${prefix}${stem === '' ? 'status' : stem}.${extension}`;
}

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
};
