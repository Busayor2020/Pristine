/**
 * Generates the app icons from @pristine/tokens.
 *
 * They are generated rather than committed so that no colour literal lives
 * outside the token package. A palette change reissues the icons.
 *
 * The mark is a placeholder standing in for the design's wordmark: the stem
 * and bowl of a lowercase p, with the accent square from the logotype. It is
 * drawn from primitives so it does not depend on Manrope having loaded, which
 * an icon rendered by the OS launcher cannot rely on.
 *
 * SVG rather than PNG so this stays dependency-free. Raster icons should be
 * added before install and store polish, since some Android launchers still
 * prefer PNG for maskable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { accent, surface, text } from '@pristine/tokens';

const APP_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const PUBLIC_DIR = path.join(APP_ROOT, 'public');

/** @param {{ padding: number, rounded: boolean }} options */
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

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const files = {
  // Browser tab. Rounded, no safe zone needed.
  'favicon.svg': mark({ padding: 0, rounded: true }),
  // Home screen. Rounded, the launcher does not crop these.
  'icon.svg': mark({ padding: 0, rounded: true }),
  // Maskable. Square edge to edge with the mark inside the 80% safe zone, so a
  // launcher can crop it to a circle or squircle without clipping the glyph.
  'icon-maskable.svg': mark({ padding: 7, rounded: false }),
};

for (const [name, contents] of Object.entries(files)) {
  fs.writeFileSync(path.join(PUBLIC_DIR, name), contents, 'utf8');
  console.log(`wrote public/${name}`);
}
