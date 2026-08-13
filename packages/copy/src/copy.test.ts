import { describe, expect, it } from 'vitest';
import { en, type CopyKey } from './en.js';
import { format, interpolate, placeholdersIn, plural } from './format.js';
import { unverifiedCopy } from './unverified.js';

const entries = Object.entries(en) as [CopyKey, string][];

describe('copy catalogue', () => {
  it('is flat', () => {
    for (const [, value] of entries) expect(typeof value).toBe('string');
  });

  it('has no empty strings', () => {
    for (const [key, value] of entries) {
      expect(value.trim(), `${key} is empty`).not.toBe('');
    }
  });

  it('uses dot-separated namespaced keys', () => {
    for (const [key] of entries) expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/);
  });

  it('has no duplicate keys once lowercased', () => {
    const seen = entries.map(([key]) => key.toLowerCase());
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('contains no em dash', () => {
    const emDash = String.fromCharCode(0x2014);
    for (const [key, value] of entries) {
      expect(value.includes(emDash), `${key} contains an em dash`).toBe(false);
    }
  });

  /**
   * The replacements had to be real punctuation, not a hyphen wearing a
   * disguise. A hyphen surrounded by spaces is exactly that.
   */
  it('never substitutes a spaced hyphen for the em dash', () => {
    for (const [key, value] of entries) {
      expect(value, `${key} uses a spaced hyphen`).not.toMatch(/\s-\s/);
    }
  });

  it('leaves no double spaces or stray whitespace', () => {
    for (const [key, value] of entries) {
      expect(value, `${key} has a double space`).not.toMatch(/ {2}/);
      expect(value, `${key} is not trimmed`).toBe(value.trim());
    }
  });

  it('balances parentheses', () => {
    for (const [key, value] of entries) {
      const open = (value.match(/\(/g) ?? []).length;
      const close = (value.match(/\)/g) ?? []).length;
      expect(open, `${key} has unbalanced parentheses`).toBe(close);
    }
  });
});

describe('claim safety', () => {
  /**
   * We cannot bypass WhatsApp compression, only reduce what it has to destroy.
   * Saying otherwise is false and invites a complaint from a company with
   * lawyers.
   */
  it('never claims we defeat compression', () => {
    const banned =
      /\b(bypass|beat|beats|defeat|defeats|disable|disables|uncompressed|lossless)\b|avoid compression|no compression|original quality/i;
    for (const [key, value] of entries) {
      expect(value, `${key} makes a banned compression claim`).not.toMatch(banned);
    }
  });

  /**
   * The photo-as-video technique is unverified. Until /experiments/results.md
   * exists, no shipped string may assert that it produces a quality gain. The
   * strings that did live in ./unverified.ts instead.
   */
  it('asserts no unmeasured quality gain', () => {
    const claims =
      /gentler|holds up better|more of your detail|survives the upload|why this works/i;
    for (const [key, value] of entries) {
      expect(value, `${key} asserts an unmeasured quality gain`).not.toMatch(claims);
    }
  });

  it('keeps the quarantined strings out of the shipped catalogue', () => {
    for (const key of Object.keys(unverifiedCopy)) {
      expect(Object.keys(en), `${key} leaked into en`).not.toContain(key);
    }
  });

  it('never implies affiliation with WhatsApp', () => {
    for (const [key, value] of entries) {
      expect(value, `${key} implies affiliation`).not.toMatch(
        /official|partner|partnership|in association|endorsed/i,
      );
    }
  });

  /** The brief fixes these two labels exactly. */
  it('keeps the comparison labels verbatim', () => {
    expect(en['compare.before']).toBe('WhatsApp would send');
    expect(en['compare.after']).toBe('Pristine sends');
  });
});

describe('format', () => {
  it('substitutes named placeholders', () => {
    expect(format('gallery.selected', { count: 3 })).toBe('3 selected');
    expect(format('library.usage', { size: '412 MB' })).toBe('Pristine is using 412 MB');
  });

  it('substitutes every placeholder in a multi-value string', () => {
    expect(format('result.dataNote', { size: '1.9 MB', time: '14s' })).toBe(
      'Uses about 1.9 MB of data to post, roughly 14s on 4G.',
    );
  });

  it('leaves an unresolved placeholder visible', () => {
    expect(format('gallery.selected')).toBe('{count} selected');
  });

  it('returns strings with no placeholders untouched', () => {
    expect(format('preset.title')).toBe('Quality');
  });

  it('reports the placeholders a string expects', () => {
    expect(placeholdersIn('sheet.tooLarge.body')).toEqual(['size', 'needed', 'available']);
    expect(placeholdersIn('preset.title')).toEqual([]);
  });

  it('interpolates an arbitrary template', () => {
    expect(interpolate('{a} then {b}', { a: 'one', b: 'two' })).toBe('one then two');
  });

  it('never leaves a placeholder unresolved when every value is supplied', () => {
    for (const key of Object.keys(en) as CopyKey[]) {
      const values = Object.fromEntries(placeholdersIn(key).map((name) => [name, 'x']));
      expect(format(key, values), `${key} left a placeholder`).not.toMatch(/\{\w+\}/);
    }
  });
});

describe('plural', () => {
  it('picks the singular for one', () => {
    expect(format(plural('library.count', 1), { count: 1 })).toBe('1 item');
  });

  it('picks the plural for none and for many', () => {
    expect(format(plural('library.count', 0), { count: 0 })).toBe('0 items');
    expect(format(plural('library.count', 12), { count: 12 })).toBe('12 items');
  });

  it('follows the locale rather than an English rule', () => {
    // Welsh has six categories. English "one or not one" would answer wrongly
    // here, which is the whole reason this goes through Intl.
    expect(plural('library.count', 2, 'cy')).toBe('library.count.other');
    expect(plural('library.count', 1, 'cy')).toBe('library.count.one');
  });

  it('falls back to other when a locale asks for a category we do not carry', () => {
    // Russian wants "few" for 3. The catalogue is English and has no such
    // entry, so the caller gets a real string instead of undefined.
    expect(plural('library.count', 3, 'ru')).toBe('library.count.other');
  });

  it('carries every category a pluralised key starts', () => {
    const bases = new Set(
      Object.keys(en)
        .filter((key) => key.endsWith('.one'))
        .map((key) => key.slice(0, -'.one'.length)),
    );
    for (const base of bases) {
      expect(en, `${base} has .one without .other`).toHaveProperty(`${base}.other`);
      expect(
        placeholdersIn(`${base}.one` as CopyKey).sort(),
        `${base} forms expect different values`,
      ).toEqual(placeholdersIn(`${base}.other` as CopyKey).sort());
    }
  });
});
