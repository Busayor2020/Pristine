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
 * Derived from the design rather than invented. The export states three size
 * and time pairings, and they agree with each other closely:
 *
 *   4.2 MB in 31s  ->  1,136,521 bps
 *   1.9 MB in 14s  ->  1,138,454 bps
 *   0.9 MB in  7s  ->  1,078,535 bps
 *
 * 1,137,000 reproduces all three figures exactly once rounded. That is a
 * plausible real world rate for a mid-range handset on Nigerian 4G, but
 * nothing in this repo measures it, and a single number cannot describe a
 * connection that varies by an order of magnitude through the day.
 *
 * Replace with field data before this drives anything more than a hint. It is
 * exported so a caller can override it rather than inherit an assumption.
 */
export const ASSUMED_UPLOAD_BPS = 1_137_000;

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
