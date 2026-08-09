/**
 * @pristine/tokens
 *
 * The single source of truth for every colour, size, radius, weight and
 * spacing value in Pristine. Consumed two ways:
 *
 *   - as TS constants, for anything that needs a value in code
 *   - as `--pr-*` CSS custom properties, generated from those same constants
 *
 * No other package may hold a colour literal. See MIGRATION.md for how these
 * values were derived from the Claude Design export and what changed.
 */

export { color, surface, text, border, accent, error, warning, info } from './color.js';
export type { Color, SurfaceToken, TextToken, StatusFamily } from './color.js';

export {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  lineHeightFor,
  letterSpacing,
} from './typography.js';
export type { Typography, FontSizeToken, FontWeightToken } from './typography.js';

export { radius } from './radius.js';
export type { RadiusToken } from './radius.js';

export { space, layout } from './spacing.js';
export type { SpaceToken } from './spacing.js';

export { borderWidth } from './border.js';
export type { BorderWidthToken } from './border.js';

export { shadow, scrim } from './shadow.js';
export type { ShadowToken } from './shadow.js';

export { duration, easing } from './motion.js';
export type { DurationToken } from './motion.js';

export { toCssVariables, toCssText, tokenTree, CSS_VAR_PREFIX } from './css.js';

/** Reads a token as a CSS custom property reference. */
export const cssVar = (name: string): string => `var(--pr-${name})`;
