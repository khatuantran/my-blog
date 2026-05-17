// apps/api ESLint — extends root + NestJS specific rules
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // NestJS uses decorators heavily — false-positive guard
      '@typescript-eslint/no-extraneous-class': 'off',
      // Allow non-null assertion sau ConfigService (validated by Zod)
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
