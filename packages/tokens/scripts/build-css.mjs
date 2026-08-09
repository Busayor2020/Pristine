/**
 * Writes the generated stylesheet and copies the hand-written font faces into
 * dist, so consumers import both from the same place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toCssText } from '../dist/css.js';

const PACKAGE_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DIST = path.join(PACKAGE_ROOT, 'dist');

fs.mkdirSync(DIST, { recursive: true });

const tokensCss = path.join(DIST, 'tokens.css');
fs.writeFileSync(tokensCss, toCssText(), 'utf8');
console.log(`wrote ${path.relative(PACKAGE_ROOT, tokensCss)}`);

// fonts.css resolves woff2 via ../fonts/, which holds from dist/ as well.
const fontsCss = path.join(DIST, 'fonts.css');
fs.copyFileSync(path.join(PACKAGE_ROOT, 'src', 'fonts.css'), fontsCss);
console.log(`wrote ${path.relative(PACKAGE_ROOT, fontsCss)}`);
