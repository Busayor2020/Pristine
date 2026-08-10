/**
 * Data cost estimates.
 *
 * These numbers are shown to users and are load bearing. This audience pays
 * for data by the megabyte, so an estimate that is quietly wrong is worse than
 * no estimate at all.
 */

/**
 * UNVERIFIED. Assumed effective upload throughput, in bits per second.
 *
 * Derived from the design rather than invented: the export pairs "1.9 MB" with
 * "roughly 14s on 4G", which implies about 1.1 Mbps. That is a plausible real
 * world figure for a mid-range handset on Nigerian 4G, but nothing in this
 * repo measures it.
 *
 * Replace with field data before this drives anything more than a hint. It is
 * exported so a caller can override it rather than inherit an assumption.
 */
export const ASSUMED_UPLOAD_BPS = 1_100_000;

/**
 * How long `bytes` takes to upload, in whole seconds.
 *
 * Rounds up rather than to nearest: an estimate that reads low feels like a
 * broken promise, one that reads high feels like a pleasant surprise.
 */
export function estimateUploadSeconds(bytes: number, bitsPerSecond = ASSUMED_UPLOAD_BPS): number {
  if (bytes < 0) throw new RangeError('bytes must not be negative');
  if (bitsPerSecond <= 0) throw new RangeError('bitsPerSecond must be positive');
  if (bytes === 0) return 0;
  return Math.max(1, Math.round((bytes * 8) / bitsPerSecond));
}
