import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-types/**',
      '**/coverage/**',
      '**/dev-dist/**',
      '**/public/**',
      '**/*.tsbuildinfo',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Build and check scripts run under Node, not in the browser.
  {
    files: ['**/*.config.{ts,js,mjs}', 'tools/**/*.{js,mjs}', '**/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
  },

  {
    files: [
      '**/*.config.{ts,js,mjs}',
      'tools/**/*.{js,mjs}',
      '**/scripts/**/*.mjs',
      'experiments/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
);
