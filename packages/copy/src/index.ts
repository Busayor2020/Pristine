/**
 * @pristine/copy
 *
 * Every user-facing string. No string literals in components.
 *
 * `./unverified.js` is deliberately NOT re-exported here. It holds the strings
 * that assert the unmeasured photo-as-video hypothesis, and reaching them has
 * to require a deep import that shows up in review.
 */
export { en } from './en.js';
export type { Copy, CopyKey } from './en.js';
export {
  format,
  interpolate,
  placeholdersIn,
  placeholdersInTemplate,
  templateParts,
  templatePartsOf,
} from './format.js';
export type { CopyValues, TemplatePart } from './format.js';
