import astro from 'eslint-plugin-astro';
import ts from 'typescript-eslint';
export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'docs/vendor/**',
      'reports/**',
      '.stryker-tmp/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
];
