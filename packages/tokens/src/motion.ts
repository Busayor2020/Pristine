/**
 * Motion.
 *
 * The design used two durations (160ms for state changes, 220ms for entrances)
 * and a single ease-out curve. Kept as-is: both are already short enough for a
 * mid-range Android to hit without dropping frames.
 *
 * Anything consuming these must still honour `prefers-reduced-motion`.
 */
export const duration = {
  /** Colour and position changes on press. */
  fast: 160,
  /** Content entering the screen. */
  normal: 220,
} as const;

export const easing = {
  out: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export type DurationToken = keyof typeof duration;
