/**
 * Enforces the single source of truth for colour.
 *
 * Hex literals are legal only inside packages/tokens, which is where the ramps
 * are defined. Everywhere else, colour must be consumed as a token constant or
 * a CSS custom property, so a palette change is a one-file change.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkTextFiles, rel } from './walk.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

// Allowed to hold colour literals.
const ALLOWED_PREFIXES = ['packages/tokens/src/', 'packages/tokens/scripts/'];

// Documentation is allowed to quote values, and this checker plus the token
// tests must be able to name them in order to check them.
const ALLOWED_FILES = new Set([
  'MIGRATION.md',
  'README.md',
  'packages/tokens/README.md',
  'tools/checks/no-stray-hex.mjs',
]);

// #rgb, #rrggbb, #rrggbbaa preceded by a non-word character.
const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;

let failures = 0;
for (const file of walkTextFiles(ROOT)) {
  const name = rel(file, ROOT);
  if (ALLOWED_FILES.has(name)) continue;
  if (ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const match of line.matchAll(HEX)) {
      failures += 1;
      console.error(
        `${name}:${i + 1}:${(match.index ?? 0) + 1}  hardcoded colour ${match[0]}\n    ${line.trim()}`,
      );
    }
  });
}

if (failures > 0) {
  console.error(
    `\n${failures} hardcoded colour literal(s) outside packages/tokens.` +
      ` Import from @pristine/tokens or use a CSS custom property.`,
  );
  process.exit(1);
}
console.log('no-stray-hex: clean');
