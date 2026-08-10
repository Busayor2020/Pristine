/**
 * Presentation of media quantities.
 *
 * Every one of these appears on screen next to a claim, so they use Intl
 * rather than string concatenation. A locale that writes 1,9 MB instead of
 * 1.9 MB is not an edge case for this audience, and neither is a numeral
 * system that is not Latin.
 */

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

/**
 * Bytes as the design writes them: "214 KB", "1.9 MB", "1.2 GB".
 *
 * KB is shown whole because a tenth of a kilobyte is noise. MB and GB keep one
 * decimal, which is the precision the user can act on when deciding whether to
 * spend their bundle.
 */
export function formatBytes(bytes: number, locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError('bytes must be a positive number');

  const [value, unit, decimals] =
    bytes >= GB
      ? [bytes / GB, 'GB', 1]
      : bytes >= MB
        ? [bytes / MB, 'MB', 1]
        : [bytes / KB, 'KB', 0];

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value as number);

  return `${formatted} ${unit as string}`;
}

/** Pixel dimensions as the design writes them, with a true multiplication sign. */
export function formatDimensions(width: number, height: number, locale = 'en'): string {
  const n = new Intl.NumberFormat(locale, { useGrouping: false });
  return `${n.format(width)} × ${n.format(height)}`;
}

/** A short duration as "6s", or "1:28" once it passes a minute. */
export function formatDuration(seconds: number, locale = 'en'): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError('seconds must be a positive number');
  }
  const whole = Math.round(seconds);
  const n = new Intl.NumberFormat(locale, { useGrouping: false });
  if (whole < 60) return `${n.format(whole)}s`;
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${n.format(minutes)}:${String(rest).padStart(2, '0')}`;
}
