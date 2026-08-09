/**
 * Border widths, in px.
 *
 * The design used 1px for every hairline and 2px for emphasis, plus a single
 * 2.5px inset ring on the selected preset card. The ring rounds to `strong`.
 */
export const borderWidth = {
  hairline: 1,
  strong: 2,
} as const;

export type BorderWidthToken = keyof typeof borderWidth;
