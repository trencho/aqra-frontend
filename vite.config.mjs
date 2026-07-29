import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
  plugins: [
    vue(),
    // autoImport pulls in only the Vuetify components actually used, which is
    // what vuetify-loader did under the old webpack build.
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
  // Vite's default output directory is already `dist`, which is what
  // capacitor.config.json's webDir and the Dockerfile both expect.
  test: {
    // Pure-logic tests need no DOM; component tests opt into jsdom per-file
    // via the `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/__tests__/**/*.spec.js'],
    server: {
      deps: {
        // Vuetify ships per-component `.css` imports. Without inlining it,
        // Node loads those files directly and throws
        // `Unknown file extension ".css"`.
        inline: ['vuetify'],
      },
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/classes/**',
        'src/services/**',
        'src/utils/**',
        'src/constants/**',
        'src/stores/**',
      ],
      reporter: ['text', 'lcov'],
      // Set to what is ACTUALLY achieved, not to an aspiration -- a threshold
      // above the real number fails from day one and gets switched off, while
      // one at the real number catches regressions from day one.
      //
      // These dropped from 54/54/55/53 when the Vuex -> Pinia migration landed.
      // That is a denominator change, not a regression: absolute covered lines
      // went UP (70 -> 103), but src/stores/ added ~140 largely untested lines
      // to the total. Phase 7 covers the store and raises these substantially.
      thresholds: {
        statements: 38,
        branches: 23,
        functions: 39,
        lines: 37,
      },
    },
  },
});
