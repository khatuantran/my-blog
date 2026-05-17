// Root shared ESLint flat config — per-app extends qua apps/<app>/eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // 1. Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.tsbuild-node/**',
      '**/.next/**',
      '**/out/**',
      'design-file/**',
      '**/*.min.js',
    ],
  },

  // 2. Base: ESLint recommended + typescript-eslint recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Universal rules cho TS/JS
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // CODING_CONVENTION.md §Logging — cấm console.*
      'no-console': 'error',
      // CODING_CONVENTION.md §Universal — TS strict
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // 4. Test files — relax rules (allow console, any cho mock data, ...)
  {
    files: ['**/tests/**/*.{ts,tsx}', '**/*.{test,spec,e2e-spec}.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 5. Config files (eslint, prettier, vite, tailwind, postcss, jest, commitlint)
  {
    files: ['**/*.config.{js,ts,mjs,cjs}', '**/*.config.*.{js,ts,mjs,cjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // 5b. Script files (prisma seed, build scripts) — allow console for CLI output
  {
    files: ['**/prisma/seed*.ts', '**/scripts/**/*.{ts,js,mjs}'],
    rules: {
      'no-console': 'off',
    },
  },

  // 6. Prettier — disable conflicting formatting rules (MUST be last)
  prettierConfig,
);
