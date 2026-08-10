import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'copy',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
