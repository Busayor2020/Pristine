import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'experiments',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
