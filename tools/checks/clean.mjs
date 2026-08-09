/** Removes build output across the workspace. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const TARGETS = ['dist', 'coverage', '.vite', 'dev-dist'];
const WORKSPACES = [
  'apps/web',
  'packages/tokens',
  'packages/ui',
  'packages/encoder',
  'experiments',
];

for (const workspace of ['.', ...WORKSPACES]) {
  for (const target of TARGETS) {
    const full = path.join(ROOT, workspace, target);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log(`removed ${path.relative(ROOT, full)}`);
    }
  }
}
for (const file of fs.globSync('**/*.tsbuildinfo', { cwd: ROOT, exclude: ['node_modules/**'] })) {
  fs.rmSync(path.join(ROOT, file), { force: true });
  console.log(`removed ${file}`);
}
