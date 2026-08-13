/**
 * Generates the app icons and the link preview image from @pristine/tokens.
 *
 * Generated rather than committed so that no colour literal lives outside the
 * token package. A palette change reissues every asset.
 *
 * The mark is a placeholder standing in for the design's wordmark: the stem and
 * bowl of a lowercase p, with the accent square from the logotype. It is drawn
 * from primitives so it does not depend on Manrope having loaded, which an icon
 * rendered by an OS launcher cannot rely on.
 *
 * SVG is the source of truth. PNG is rasterised from the same SVG because iOS
 * ignores SVG for apple-touch-icon entirely, some Android launchers still
 * prefer PNG for maskable, and no social scraper will render an SVG preview
 * card. resvg is a devDependency of this app only and runs at build time; none
 * of it ships.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { accent, surface, text } from '@pristine/tokens';

const APP_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const PUBLIC_DIR = path.join(APP_ROOT, 'public');

/**
 * The mark, on a square canvas.
 *
 * @param {{ padding: number, rounded: boolean }} options
 *   padding is in the 64 unit coordinate space, and creates the safe zone a
 *   maskable icon needs so a launcher can crop to a circle without clipping.
 */
function mark({ padding, rounded }) {
  const size = 64;
  const inner = size - padding * 2;
  const scale = inner / 64;
  const t = (value) => (padding + value * scale).toFixed(2);
  const s = (value) => (value * scale).toFixed(2);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `  <rect width="${size}" height="${size}"${rounded ? ' rx="14"' : ''} fill="${surface[0]}"/>`,
    `  <rect x="${t(17)}" y="${t(14)}" width="${s(7)}" height="${s(38)}" fill="${text.primary}"/>`,
    `  <circle cx="${t(32)}" cy="${t(27)}" r="${s(10.5)}" fill="none" stroke="${text.primary}" stroke-width="${s(7)}"/>`,
    `  <rect x="${t(44)}" y="${t(38)}" width="${s(9)}" height="${s(9)}" fill="${accent.base}"/>`,
    '</svg>',
    '',
  ].join('\n');
}

/**
 * The link preview card, at the 1.91:1 ratio Open Graph expects.
 *
 * This one matters more than usual: the product's own distribution channel is
 * WhatsApp, so the link gets pasted into exactly the app it is about. Without
 * it the share previews as bare text.
 *
 * Text is drawn as paths-free primitives plus a single system font fallback
 * only for the tagline. resvg has no font loaded, so the wordmark is the same
 * geometric mark rather than type, and the card carries no copy that has to be
 * legible at small sizes.
 */
function preview() {
  const w = 1200;
  const h = 630;
  const cx = 300;
  const cy = h / 2;
  const unit = 3.4;
  const p = (value) => (value * unit).toFixed(2);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `  <rect width="${w}" height="${h}" fill="${surface[0]}"/>`,
    // A wide accent rule along the bottom, so the card reads as branded even as
    // a thumbnail where the mark is only a few pixels across.
    `  <rect x="0" y="${h - 10}" width="${w}" height="10" fill="${accent.base}"/>`,
    `  <g transform="translate(${cx - 32 * unit} ${cy - 32 * unit})">`,
    `    <rect x="${p(17)}" y="${p(14)}" width="${p(7)}" height="${p(38)}" fill="${text.primary}"/>`,
    `    <circle cx="${p(32)}" cy="${p(27)}" r="${p(10.5)}" fill="none" stroke="${text.primary}" stroke-width="${p(7)}"/>`,
    `    <rect x="${p(44)}" y="${p(38)}" width="${p(9)}" height="${p(9)}" fill="${accent.base}"/>`,
    '  </g>',
    // A stand-in for the before and after comparison: two panels split by the
    // accent line, the left one muted and the right one clean.
    `  <g transform="translate(620 145)">`,
    `    <rect width="440" height="340" rx="18" fill="${surface[2]}"/>`,
    `    <rect width="216" height="340" rx="18" fill="${surface[3]}"/>`,
    `    <rect x="216" y="0" width="4" height="340" fill="${accent.base}"/>`,
    `    <circle cx="218" cy="170" r="30" fill="${accent.base}"/>`,
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

/** Rasterises an SVG string at a given pixel width. */
function raster(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const rounded = mark({ padding: 0, rounded: true });
// Maskable needs the glyph inside the 80% safe zone, and a square edge so the
// launcher owns the corner shape rather than fighting ours.
const maskable = mark({ padding: 7, rounded: false });
const card = preview();

/** @type {Array<[string, Buffer | string]>} */
const files = [
  ['favicon.svg', rounded],
  ['icon.svg', rounded],
  ['icon-maskable.svg', maskable],
  ['icon-192.png', raster(rounded, 192)],
  ['icon-512.png', raster(rounded, 512)],
  ['icon-maskable-512.png', raster(maskable, 512)],
  // iOS ignores SVG here and does not honour transparency, so this is the
  // rounded mark on its own opaque background at the size iOS asks for.
  ['apple-touch-icon.png', raster(rounded, 180)],
  ['og-image.png', raster(card, 1200)],
];

for (const [name, contents] of files) {
  fs.writeFileSync(path.join(PUBLIC_DIR, name), contents);
  const bytes = typeof contents === 'string' ? Buffer.byteLength(contents) : contents.length;
  console.log(`wrote public/${name} (${bytes} bytes)`);
}
