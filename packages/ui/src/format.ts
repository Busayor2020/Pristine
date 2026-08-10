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

export type ByteUnit = 'KB' | 'MB' | 'GB';

export interface FormatBytesOptions {
  readonly locale?: string;
  /**
   * Forces a unit instead of picking one by magnitude.
   *
   * Needed wherever sizes are compared against each other. On the quality
   * screen the three tiers are 4.2 MB, 1.9 MB and 0.9 MB: letting the smallest
   * fall to "922 KB" would make the reader convert units in their head on the
   * one screen whose entire job is comparing those numbers.
   */
  readonly unit?: ByteUnit;
}

const DIVISOR: Readonly<Record<ByteUnit, number>> = { KB, MB, GB };

/**
 * Bytes as the design writes them: "214 KB", "1.9 MB", "1.2 GB".
 *
 * KB is shown whole because a tenth of a kilobyte is noise. MB and GB keep one
 * decimal, which is the precision a user can act on when deciding whether to
 * spend their bundle.
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError('bytes must be a positive number');

  const { locale = 'en', unit } = options;
  const chosen: ByteUnit = unit ?? (bytes >= GB ? 'GB' : bytes >= MB ? 'MB' : 'KB');

  const formatted = new Intl.NumberFormat(locale, {
    // Up to one decimal, never a trailing zero. The design writes "412 MB" and
    // "1.9 MB", not "412.0 MB": a decimal the value does not have reads as
    // false precision on a storage figure.
    minimumFractionDigits: 0,
    maximumFractionDigits: chosen === 'KB' ? 0 : 1,
  }).format(bytes / DIVISOR[chosen]);

  return `${formatted} ${chosen}`;
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
