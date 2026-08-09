/**
 * Spacing scale, in px.
 *
 * The design used 23 distinct padding, gap and margin values covering almost
 * every integer from 2 to 40. Collapsed to an 11 step scale, mapped by nearest
 * with ties rounding up. Full mapping in MIGRATION.md.
 *
 * Ordinal keys rather than t-shirt sizes: spacing has no natural semantic
 * names, and `space[6]` reads more honestly than inventing `comfortable`.
 */
export const space = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 12,
  6: 16,
  7: 20,
  8: 24,
  9: 32,
  10: 40,
} as const;

/**
 * Horizontal padding for full-bleed screen content. The design settled on 24px
 * for primary screens and 16px for sheets and inset cards.
 */
export const layout = {
  screenPaddingX: space[8],
  sheetPaddingX: space[6],
} as const;

export type SpaceToken = keyof typeof space;
