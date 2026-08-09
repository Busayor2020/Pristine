import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-types',
  'build',
  'coverage',
  '.vite',
  'dev-dist',
]);

/**
 * Repo-relative directories holding generated output. The checks police source,
 * not artefacts: apps/web/public is written by build-icons.mjs from the token
 * values, so flagging the colours in it would be flagging the tokens.
 */
const IGNORED_PATHS = new Set(['apps/web/public']);

const BINARY_EXT = new Set([
  '.woff2',
  '.woff',
  '.ttf',
  '.otf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.ico',
  '.gz',
  '.zip',
  '.pdf',
]);

/**
 * Yields every tracked-ish text file under `root`, skipping build output,
 * dependencies and binary assets.
 *
 * @param {string} root
 * @returns {Generator<string>}
 */
export function* walkTextFiles(root) {
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (dir === undefined) break;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        if (IGNORED_PATHS.has(rel(full, root))) continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (BINARY_EXT.has(path.extname(entry.name).toLowerCase())) continue;
      if (entry.name === 'pnpm-lock.yaml') continue;
      yield full;
    }
  }
}

/** @param {string} file @param {string} root */
export const rel = (file, root) => path.relative(root, file).split(path.sep).join('/');
