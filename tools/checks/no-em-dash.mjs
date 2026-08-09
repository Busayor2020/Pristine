/**
 * Repo-wide em dash check.
 *
 * The ESLint rule covers JS and TS source. This covers everything else that
 * ships or documents: Markdown, CSS, HTML, JSON, YAML. Together they make the
 * "no em dash anywhere" guarantee real rather than aspirational.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkTextFiles, rel } from './walk.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const EM_DASH = String.fromCharCode(0x2014);

let failures = 0;
for (const file of walkTextFiles(ROOT)) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(EM_DASH)) continue;

  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.includes(EM_DASH)) return;
    failures += 1;
    console.error(
      `${rel(file, ROOT)}:${i + 1}:${line.indexOf(EM_DASH) + 1}  em dash found\n    ${line.trim()}`,
    );
  });
}

if (failures > 0) {
  console.error(
    `\n${failures} em dash occurrence(s). Use a period, comma, colon or parenthesis instead of a hyphen.`,
  );
  process.exit(1);
}
console.log('no-em-dash: clean');
