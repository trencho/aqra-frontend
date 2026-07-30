import pluginJs from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...pluginVue.configs['flat/essential'],
  pluginJs.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      // node globals as well as browser: the config files here (vite.config.mjs,
      // this file) run under Node. Application code reads env vars from
      // import.meta.env, not process.env -- see src/services/axios.js.
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/require-default-prop': 'off',

      // Import hygiene, autofixable with `eslint . --fix`. simple-import-sort
      // reads SFC <script> blocks through vue-eslint-parser, and leaves
      // side-effect imports (e.g. `import 'leaflet/dist/leaflet.css'`) in place
      // rather than reordering them across statements that depend on load order.
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // unused-imports supersedes the base rule: it can autofix an unused
      // import away, where no-unused-vars can only report it.
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: [
      'dist/',
      'coverage/',
      'android/',
      'ios/',
      'node_modules/',
      '.yarn/',
    ],
  },
];
