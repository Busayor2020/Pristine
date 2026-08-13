import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { accent, surface } from '@pristine/tokens';
import { en } from '@pristine/copy';

/**
 * Asserts the built document, not the source.
 *
 * index.html carries almost none of this: the head tags are injected by the
 * pristine-head-tags plugin in vite.config.ts, because they need token and copy
 * values that must not be hardcoded. That indirection is worth a test, since a
 * missing meta tag is invisible until someone pastes a link into WhatsApp and
 * gets bare text back.
 *
 * Skips itself when there is no build, so `pnpm test` on a clean tree does not
 * fail for the wrong reason.
 */
const DIST = path.resolve(fileURLToPath(import.meta.url), '../../dist');
const built = fs.existsSync(path.join(DIST, 'index.html'));
const html = built ? fs.readFileSync(path.join(DIST, 'index.html'), 'utf8') : '';
const manifest = built
  ? (JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8')) as Record<
      string,
      unknown
    >)
  : {};

describe.skipIf(!built)('built document head', () => {
  /**
   * The spec wants the encoding declaration inside the first 1024 bytes. Vite
   * prepends injected tags to head by default, which pushed it past that.
   */
  it('declares its charset early enough that a parser never has to guess', () => {
    expect(html.indexOf('charset')).toBeGreaterThan(0);
    expect(html.indexOf('charset')).toBeLessThan(1024);
  });

  it('takes theme-color from the accent token', () => {
    expect(html).toContain(`name="theme-color" content="${accent.base}"`);
  });

  it('carries the iOS tags the manifest cannot cover', () => {
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('black-translucent');
    expect(html).toContain('rel="apple-touch-icon"');
  });

  it('takes its description from the copy catalogue', () => {
    expect(html).toContain(en['meta.description']);
  });

  /**
   * The share target is WhatsApp, the product's own distribution channel. A
   * relative og:image does not render, because scrapers do not resolve them.
   */
  it('has an absolute Open Graph image with its dimensions', () => {
    const image = /property="og:image" content="(.+?)"/.exec(html)?.[1];
    expect(image).toMatch(/^https:\/\//);
    expect(image).toMatch(/og-image\.png$/);
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
  });

  it('has a large summary card for Twitter', () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });
});

describe.skipIf(!built)('web app manifest', () => {
  /** Without an id, Chrome derives install identity from start_url. */
  it('pins its install identity', () => {
    expect(manifest['id']).toBe('/');
  });

  it('takes its colours from the tokens', () => {
    expect(manifest['theme_color']).toBe(accent.base);
    expect(manifest['background_color']).toBe(surface[0]);
  });

  it('takes its name and description from the copy catalogue', () => {
    expect(manifest['name']).toBe(en['meta.title']);
    expect(manifest['description']).toBe(en['meta.description']);
  });

  /** Some Android launchers still prefer PNG, and stores require it. */
  it('offers raster icons as well as vector, including a maskable one', () => {
    const icons = manifest['icons'] as { src: string; type: string; purpose?: string }[];
    expect(icons.some((icon) => icon.type === 'image/png' && icon.src.includes('192'))).toBe(true);
    expect(icons.some((icon) => icon.type === 'image/png' && icon.src.includes('512'))).toBe(true);
    expect(icons.some((icon) => icon.purpose === 'maskable' && icon.type === 'image/png')).toBe(
      true,
    );
  });
});

describe.skipIf(!built)('generated assets', () => {
  it('writes every file the head and manifest point at', () => {
    for (const name of [
      'favicon.svg',
      'icon.svg',
      'icon-maskable.svg',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'apple-touch-icon.png',
      'og-image.png',
    ]) {
      expect(fs.existsSync(path.join(DIST, name)), `${name} is missing`).toBe(true);
    }
  });
});
