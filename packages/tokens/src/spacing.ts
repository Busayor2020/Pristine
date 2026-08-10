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
 * Layout constants that are not spacing but are still values a component must
 * not invent. A magic pixel in a component is a defect, so anything with a
 * fixed size lands here.
 */
export const layout = {
  /** Screens carrying prose. First run, education, permission. */
  screenPaddingX: space[8],
  /** Dense screens, sheets and inset cards. Result, export, library. */
  contentPaddingX: space[6],

  /**
   * Minimum hit area for anything interactive, in px.
   *
   * Not negotiable and not a style choice. The product is used one handed,
   * outdoors, often in a hurry. A control smaller than this gets missed, and a
   * missed control on the export screen means a lost post.
   */
  minTouchTarget: 44,

  /** Screen header. Back control, title, trailing status. */
  appBarHeight: 48,

  /** The single primary action at the bottom of a screen. */
  primaryControlHeight: 54,

  /**
   * The before and after preview box.
   *
   * The design fixes it at 358x404 inside a 390 wide frame. Expressed as a
   * ratio rather than a height so it holds on a narrower handset instead of
   * pushing the primary action off screen.
   */
  compareAspectRatio: '179 / 202',
} as const;

export type SpaceToken = keyof typeof space;
