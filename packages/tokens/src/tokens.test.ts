import { describe, expect, it } from 'vitest';
import { accent, color, error, info, surface, text, warning } from './color.js';
import { fontSize, fontWeight, letterSpacing, lineHeightFor } from './typography.js';
import { radius } from './radius.js';
import { space } from './spacing.js';
import { toCssText, toCssVariables } from './css.js';

const HEX = /^#[0-9A-F]{6}$/;

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r = 0, g = 0, b = 0] = linear;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('colour', () => {
  it('is expressed entirely as six digit uppercase hex', () => {
    const values = JSON.stringify(color).match(/"#[^"]+"/g) ?? [];
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value.slice(1, -1)).toMatch(HEX);
  });

  it('gives every status family the same five slots as the accent', () => {
    const slots = Object.keys(accent).sort();
    for (const family of [error, warning, info]) {
      expect(Object.keys(family).sort()).toEqual(slots);
    }
  });

  it('keeps the surface ramp monotonically lighter', () => {
    const ramp = [surface[0], surface[1], surface[2], surface[3], surface[4], surface[5]];
    const levels = ramp.map(luminance);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]!).toBeGreaterThan(levels[i - 1]!);
    }
  });

  it('keeps the text ramp monotonically dimmer', () => {
    const ramp = [text.primary, text.secondary, text.tertiary, text.muted];
    const levels = ramp.map(luminance);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]!).toBeLessThan(levels[i - 1]!);
    }
  });

  /**
   * The reason the type scale has a 12px floor is the same reason this matters:
   * these screens get used outdoors. Anything that carries meaning has to clear
   * AA on the surfaces it is actually allowed to sit on.
   */
  it('clears WCAG AA for body text on every surface it is used on', () => {
    const surfaces = [surface[0], surface[1], surface[2], surface[3], surface[4]];
    for (const bg of surfaces) {
      for (const fg of [text.primary, text.secondary, text.tertiary, text.muted]) {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  /**
   * text.muted on surface-5 lands at 4.13, below AA. Pinned here so the
   * limitation is visible and cannot regress further. See MIGRATION.md.
   */
  it('records that muted text on surface-5 is the one pair below AA', () => {
    expect(contrast(text.muted, surface[5])).toBeLessThan(4.5);
    expect(contrast(text.muted, surface[5])).toBeGreaterThan(4);
    expect(contrast(text.tertiary, surface[5])).toBeGreaterThanOrEqual(4.5);
  });

  it('clears AA for text sitting on an accent or status fill', () => {
    for (const family of [accent, error, warning, info]) {
      expect(contrast(text.onAccent, family.base)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps status surfaces dark enough to carry primary text', () => {
    for (const family of [accent, error, warning, info]) {
      expect(contrast(text.primary, family.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('type scale', () => {
  it('has at most 7 steps', () => {
    expect(Object.keys(fontSize).length).toBeLessThanOrEqual(7);
  });

  it('never goes below 12px', () => {
    for (const size of Object.values(fontSize)) expect(size).toBeGreaterThanOrEqual(12);
  });

  it('uses whole pixels only', () => {
    for (const size of Object.values(fontSize)) expect(Number.isInteger(size)).toBe(true);
  });

  it('ascends', () => {
    const sizes = Object.values(fontSize);
    for (let i = 1; i < sizes.length; i += 1) expect(sizes[i]!).toBeGreaterThan(sizes[i - 1]!);
  });

  it('pairs every size step with a line height', () => {
    expect(Object.keys(lineHeightFor).sort()).toEqual(Object.keys(fontSize).sort());
  });

  it('keeps weights inside the Manrope variable axis', () => {
    for (const weight of Object.values(fontWeight)) {
      expect(weight).toBeGreaterThanOrEqual(200);
      expect(weight).toBeLessThanOrEqual(800);
    }
  });

  it('expresses tracking in em', () => {
    for (const value of Object.values(letterSpacing)) expect(value).toMatch(/^-?[\d.]+em$/);
  });
});

describe('radius and spacing', () => {
  it('has exactly 4 radii', () => {
    expect(Object.keys(radius)).toHaveLength(4);
  });

  it('ascends through the radius scale', () => {
    const values = Object.values(radius);
    for (let i = 1; i < values.length; i += 1) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });

  it('starts spacing at zero and ascends', () => {
    const values = Object.values(space);
    expect(values[0]).toBe(0);
    for (let i = 1; i < values.length; i += 1) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });
});

describe('css generation', () => {
  it('prefixes every variable', () => {
    for (const name of toCssVariables().keys()) expect(name.startsWith('--pr-')).toBe(true);
  });

  it('gives lengths a px unit and keeps weights unitless', () => {
    const vars = toCssVariables();
    expect(vars.get('--pr-font-size-xs')).toBe('12px');
    expect(vars.get('--pr-radius-md')).toBe('12px');
    expect(vars.get('--pr-space-6')).toBe('16px');
    expect(vars.get('--pr-font-weight-bold')).toBe('700');
    expect(vars.get('--pr-line-height-normal')).toBe('1.5');
    expect(vars.get('--pr-duration-fast')).toBe('160ms');
  });

  it('exposes the colour ramps by role', () => {
    const vars = toCssVariables();
    expect(vars.get('--pr-color-surface-0')).toBe(surface[0]);
    expect(vars.get('--pr-color-text-primary')).toBe(text.primary);
    expect(vars.get('--pr-color-text-on-accent')).toBe(text.onAccent);
    expect(vars.get('--pr-color-accent-base')).toBe(accent.base);
    expect(vars.get('--pr-color-error-border')).toBe(error.border);
  });

  it('emits a :root block with no duplicate names', () => {
    const css = toCssText();
    expect(css).toContain(':root {');
    const names = [...css.matchAll(/^ {2}(--pr-[a-z0-9-]+):/gm)].map((m) => m[1]!);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(toCssVariables().size);
  });

  it('names nothing after a hue', () => {
    const banned = /--pr-color-(orange|red|green|blue|yellow|purple|pink|grey|gray)/;
    expect(toCssText()).not.toMatch(banned);
  });
});
