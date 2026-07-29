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
        'src/components/**',
        'src/services/**',
        'src/utils/**',
        'src/constants/**',
        'src/stores/**',
      ],
      exclude: ['src/**/__tests__/**'],
      reporter: ['text', 'lcov'],
      // Set to what is ACTUALLY achieved, not to an aspiration -- a threshold
      // above the real number fails from day one and gets switched off, while
      // one at the real number catches regressions from day one.
      //
      // Components are included in the denominator now that they are tested,
      // so this is the honest whole-app figure rather than a flattering subset.
      //
      // What is still uncovered is deliberate: Map.vue's dead
      // decrement/increment/playSlider (Phase 8 deletes them), services/
      // store.js (a one-line createPinia call), and the branches of
      // TranslationButton's menu that only open on real pointer interaction.
      thresholds: {
        statements: 89,
        branches: 86,
        functions: 85,
        lines: 89,
      },
    },
  },
});
