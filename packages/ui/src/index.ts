/**
 * @pristine/ui
 *
 * Shared presentation layer. Today it holds the copy catalogue; components
 * land here as screens get built, and they consume colour and sizing only
 * through @pristine/tokens.
 */
export { en, format, placeholdersIn } from './copy/index.js';
export type { Copy, CopyKey, CopyValues } from './copy/index.js';
