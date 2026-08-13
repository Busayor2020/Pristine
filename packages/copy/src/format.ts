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
 * Substitutes `{name}` placeholders in an arbitrary template.
 *
 * An unresolved placeholder is left verbatim rather than blanked, so a missing
 * value shows up in review instead of silently producing "Uses about  of data".
 */
export function interpolate(template: string, values: CopyValues = {}): string {
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name];
    return value === undefined ? whole : String(value);
  });
}

/** Resolves a copy key, substituting any `{name}` placeholders. */
export function format(key: CopyKey, values: CopyValues = {}): string {
  return interpolate(en[key], values);
}

/** The placeholder names a given template expects. */
export function placeholdersInTemplate(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER)].map((match) => match[1] as string);
}

/** The placeholder names a given copy string expects. */
export function placeholdersIn(key: CopyKey): string[] {
  return placeholdersInTemplate(en[key]);
}

/**
 * Picks the right plural form for a count.
 *
 * Intl.PluralRules rather than `count === 1`, because that test is an English
 * assumption. Several of the languages this product already lists in settings
 * do not split one from many the way English does, and a hardcoded ternary
 * would have to be unpicked for every one of them.
 *
 * Looks for `<key>.one`, `<key>.other` and so on, falling back to `other`,
 * which every locale defines.
 */
export function plural(base: string, count: number, locale = 'en'): CopyKey {
  const category = new Intl.PluralRules(locale).select(count);
  const candidate = `${base}.${category}` as CopyKey;
  return candidate in en ? candidate : (`${base}.other` as CopyKey);
}

export type TemplatePart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'placeholder'; readonly name: string };

/**
 * A copy string split into literal text and its placeholders.
 *
 * Exists so a screen can emphasise an interpolated value (a size, a duration)
 * without the sentence being concatenated at the call site. Concatenation is
 * what breaks translation: the emphasised value does not sit in the same place
 * in every language, and splitting on the template preserves whatever order
 * the translator chose.
 */
export function templatePartsOf(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let cursor = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ kind: 'text', text: template.slice(cursor, index) });
    parts.push({ kind: 'placeholder', name: match[1] as string });
    cursor = index + match[0].length;
  }
  if (cursor < template.length) parts.push({ kind: 'text', text: template.slice(cursor) });
  return parts;
}

/** As `templatePartsOf`, for a key in the shipped catalogue. */
export function templateParts(key: CopyKey): TemplatePart[] {
  return templatePartsOf(en[key]);
}
