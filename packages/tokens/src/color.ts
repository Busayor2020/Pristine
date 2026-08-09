/**
 * Colour tokens.
 *
 * Named by role, never by hue. `accent` is orange today; if it becomes green
 * tomorrow, nothing downstream has to be renamed. The literal hex values in
 * this file are the only ones allowed in the repo (enforced by
 * `tools/checks/no-stray-hex.mjs`).
 *
 * Every value traces back to the Claude Design export. See MIGRATION.md for
 * the full old-to-new mapping and the rationale behind each change.
 */

/**
 * Background ramp, darkest first. surface-0 is the app background; each step up
 * is a layer closer to the viewer (cards, rows, sheets, pressed states).
 */
export const surface = {
  0: '#0A0B0D',
  1: '#0E1013',
  2: '#121417',
  3: '#171A1F',
  4: '#1B1E23',
  5: '#23272E',
  /**
   * Pure black, used only as the letterbox behind photos and video. Snapping
   * this to surface-0 would tint the bars against true-black media, so it stays
   * a distinct token rather than an alias.
   */
  media: '#000000',
} as const;

/** Foreground ramp, brightest first. */
export const text = {
  primary: '#F3F5F7',
  secondary: '#C6CCD4',
  tertiary: '#9BA3AE',
  muted: '#7E8794',
  /** For text and icons sitting on an accent or status fill. */
  onAccent: '#0A0B0D',
} as const;

/**
 * Hairlines and dividers. `subtle` is the same value as surface-5: the design
 * uses it both as a raised surface and as a quiet border, so it is aliased
 * rather than duplicated.
 */
export const border = {
  subtle: '#23272E',
  default: '#333941',
  strong: '#4A525C',
} as const;

/**
 * The brand accent and its interaction states.
 *
 * base, hover and pressed are taken verbatim from the design. `surface` and
 * `border` are the accent-tinted fills the design already used for selected
 * rows and outlines.
 */
export const accent = {
  base: '#FF5A1F',
  hover: '#FF7A46',
  pressed: '#EF4E14',
  surface: '#1C1109',
  border: '#4A2412',
} as const;

/**
 * Status families.
 *
 * The design shipped a single flat hex for each of these with no interaction or
 * container variants, which made them unusable for anything beyond a coloured
 * dot. Each is expanded into the same five-slot shape as `accent`, derived by
 * applying the accent's own measured HSL deltas to the status hue:
 * hover is L +0.077, pressed is L -0.053 with S -0.128, and the surface and
 * border tints adopt the accent tint's absolute S/L (0.51/0.07 and 0.61/0.18).
 *
 * Re-deriving the accent from its own base with these deltas reproduces
 * #EF4E14 exactly and lands within 3/255 per channel on the other three, so the
 * families stay visually consistent with each other.
 */
export const error = {
  base: '#FF3D6E',
  hover: '#FF648B',
  pressed: '#F13061',
  surface: '#1C090E',
  border: '#4A1220',
} as const;

export const warning = {
  base: '#E8B33D',
  hover: '#ECC160',
  pressed: '#D6A434',
  surface: '#1C1609',
  border: '#4A3912',
} as const;

export const info = {
  base: '#7B61FF',
  hover: '#9C88FF',
  pressed: '#6C52F3',
  surface: '#0C091C',
  border: '#1B124A',
} as const;

export const color = {
  surface,
  text,
  border,
  accent,
  error,
  warning,
  info,
} as const;

export type Color = typeof color;
export type SurfaceToken = keyof typeof surface;
export type TextToken = keyof typeof text;
export type StatusFamily = typeof accent;
