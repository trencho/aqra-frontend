import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...pluginVue.configs['flat/essential'],
  pluginJs.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      // node globals as well as browser: `process.env` is read in
      // src/services/axios.js and substituted at build time.
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
