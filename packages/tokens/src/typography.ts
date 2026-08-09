/**
 * Typography tokens.
 *
 * The design used 24 distinct font sizes, several of them half-pixel
 * (12.5, 13.5, 14.5, 15.5, 16.5) and several below 12px (9.5, 10, 10.5, 11,
 * 11.5). That is not a scale, it is a set of one-off decisions.
 *
 * This collapses to 7 steps with a 12px floor. The floor is a legibility
 * requirement, not a taste call: Pristine's users are outdoors in daylight on
 * mid-range Android hardware, where sub-12px text on a dim panel is genuinely
 * unreadable. Every original size maps to its nearest new step, and ties round
 * up for the same reason. Full mapping in MIGRATION.md.
 */

/** Font sizes in px. */
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 28,
  '3xl': 40,
} as const;

/**
 * Unitless line heights. `none` is for large numerals where the design set 0.9
 * to keep a single glyph optically centred.
 */
export const lineHeight = {
  none: 1,
  tight: 1.1,
  snug: 1.35,
  normal: 1.5,
} as const;

/** The line height each size step defaults to. */
export const lineHeightFor = {
  xs: lineHeight.snug,
  sm: lineHeight.snug,
  md: lineHeight.normal,
  lg: lineHeight.normal,
  xl: lineHeight.tight,
  '2xl': lineHeight.tight,
  '3xl': lineHeight.none,
} as const;

/**
 * Tracking, in em. Manrope is slightly wide at display sizes, so headings pull
 * in and small uppercase labels push out.
 */
export const letterSpacing = {
  tighter: '-0.04em',
  tight: '-0.02em',
  normal: '0em',
  wide: '0.02em',
  widest: '0.14em',
} as const;

/**
 * Only the weights the design actually uses. Manrope is a variable font with a
 * 200 to 800 wght axis, so adding a step later costs nothing at runtime.
 */
export const fontWeight = {
  regular: 400,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/**
 * Manrope is the only family. The stack behind it is a fallback for the
 * first paint before the self-hosted woff2 lands, not a second brand voice.
 */
export const fontFamily = {
  sans: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  /** Sizes, durations and byte counts, so digits do not jitter while updating. */
  numeric: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  lineHeightFor,
  letterSpacing,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type Typography = typeof typography;
