import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // vue2-essential, not essential: the default preset targets Vue 3 and flags
  // `beforeDestroy` in favour of `beforeUnmount`, which does not exist in Vue 2.
  // Switch to flat/essential as part of the Vue 3 migration.
  ...pluginVue.configs['flat/vue2-essential'],
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
    ignores: ['dist/', 'android/', 'ios/', 'node_modules/'],
  },
];
