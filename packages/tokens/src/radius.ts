/**
 * Corner radii, in px.
 *
 * The design used 15 distinct values (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
 * 16, 20 and 50%) with no discernible rule. Collapsed to 4, mapped by nearest
 * with ties rounding up. Full mapping in MIGRATION.md.
 */
export const radius = {
  /** Chips, badges, small inline tags. */
  sm: 6,
  /** The default. Buttons, inputs, cards, list rows. */
  md: 12,
  /** Sheets, modals, large media containers. */
  lg: 20,
  /** Avatars, icon buttons, the home indicator. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
