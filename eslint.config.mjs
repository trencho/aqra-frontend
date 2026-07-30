import pluginJs from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...pluginVue.configs['flat/essential'],
  pluginJs.configs.recommended,

  // Scoped to **/*.ts on purpose. typescript-eslint's shared configs set
  // `languageOptions.parser` with no `files` restriction, so spreading them at
  // the top level would replace vue-eslint-parser for .vue files too and break
  // SFC parsing outright. tseslint.config() pins them to TypeScript files.
  ...tseslint.config({
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
  }),

  {
    // `ts` added for the migration. Without it the migrated files get no
    // import-order and no unused-import enforcement, and `yarn lint` keeps
    // reporting success over code it is no longer looking at.
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      // node globals as well as browser: the config files here (vite.config.mjs,
      // this file) run under Node. Application code reads env vars from
      // import.meta.env, not process.env -- see src/services/axios.ts.
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
    // typescript-eslint's recommended set turns this on for .ts files, where it
    // would duplicate unused-imports/no-unused-vars above -- two rules
    // reporting the same finding, only one of which can autofix it.
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  {
    // vue-eslint-parser stays the parser for SFCs (set by flat/essential
    // above); this only tells it which parser to hand each <script> block to,
    // keyed by the block's `lang`. Both keys are needed mid-migration, while
    // some components are still <script> and others are <script lang="ts">.
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: {
          js: 'espree',
          ts: tseslint.parser,
        },
      },
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
