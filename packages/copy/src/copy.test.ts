import { describe, expect, it } from 'vitest';
import { en, type CopyKey } from './en.js';
import { format, interpolate, placeholdersIn } from './format.js';
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
