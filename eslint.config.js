import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import pristine from './tools/eslint-rules/index.js';

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
    plugins: { pristine },
    rules: {
      'pristine/no-em-dash': 'error',
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

  // packages/encoder is framework-free by contract. Nothing from React, and
  // nothing from the DOM-bound UI package, may cross into it.
  {
    files: ['packages/encoder/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'packages/encoder must stay framework-free.' },
            { name: 'react-dom', message: 'packages/encoder must stay framework-free.' },
            { name: '@pristine/ui', message: 'packages/encoder must not depend on the UI layer.' },
          ],
          patterns: ['react/*', 'react-dom/*', '@pristine/ui/*'],
        },
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
