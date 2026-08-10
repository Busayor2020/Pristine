import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/tokens',
      'packages/copy',
      'packages/ui',
      'packages/encoder',
      'apps/web',
      'experiments',
    ],
  },
});
