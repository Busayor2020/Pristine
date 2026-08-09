/**
 * Minimal `{name}` interpolation over the copy catalogue.
 *
 * Deliberately not an i18n library. The catalogue is already shaped the way
 * ICU message loaders expect (flat keys, named placeholders, no concatenation),
 * so swapping this for a real formatter later is a change of one module, not a
 * rewrite of every call site.
 */
import { en, type CopyKey } from './en.js';

export type CopyValues = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Resolves a copy key, substituting any `{name}` placeholders.
 *
 * An unresolved placeholder is left verbatim rather than blanked, so a missing
 * value shows up in review instead of silently producing "Uses about  of data".
 */
export function format(key: CopyKey, values: CopyValues = {}): string {
  return en[key].replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name];
    return value === undefined ? whole : String(value);
  });
}

/** The placeholder names a given copy string expects. */
export function placeholdersIn(key: CopyKey): string[] {
  return [...en[key].matchAll(PLACEHOLDER)].map((match) => match[1] as string);
}
