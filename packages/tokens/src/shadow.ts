/**
 * Elevation.
 *
 * The design used four shadows, two of which (0 4px 14px at 50% and
 * 0 4px 16px at 55%) were within a pixel and five percent of each other.
 * Collapsed to two, plus the hairline ring the compare handle draws to hold
 * itself off bright media.
 *
 * Values stay as raw rgba rather than colour tokens: a shadow is an opacity
 * over whatever is behind it, not a surface, so it does not belong on the
 * colour ramp.
 */
export const shadow = {
  /** Buttons and chips lifted off a surface. */
  sm: '0 2px 8px rgba(0, 0, 0, 0.6)',
  /** Sheets, drag handles, anything floating over media. */
  md: '0 4px 16px rgba(0, 0, 0, 0.55)',
  /** Separates a light control from bright media underneath it. */
  ring: '0 0 0 1px rgba(10, 11, 13, 0.5)',
} as const;

/** Scrim behind sheets and over media captions. */
export const scrim = {
  sheet: 'rgba(10, 11, 13, 0.75)',
  caption: 'rgba(10, 11, 13, 0.72)',
  blur: '6px',
} as const;

export type ShadowToken = keyof typeof shadow;
