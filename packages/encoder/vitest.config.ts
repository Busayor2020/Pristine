import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'encoder',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
