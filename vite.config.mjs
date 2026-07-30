import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
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
    // Both extensions, for the duration of the TypeScript migration and after.
    // A `.js`-only glob silently stops collecting a spec the moment it is
    // renamed to `.ts` -- `yarn test` still exits 0, just with fewer tests. The
    // suite size (270 across 21 files) is the check that catches that.
    include: ['src/**/__tests__/**/*.spec.{js,ts}'],
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
        // Extension-globbed for the same reason as `include` above: spelled
        // 'src/main.js', this entry silently stops matching when the entry
        // point becomes main.ts, dropping the only test that catches the
        // leaflet.heat import-order hazard out of the coverage report.
        // The directory entries below are already extension-agnostic.
        'src/main.{js,ts}',
        'src/classes/**',
        'src/components/**',
        'src/services/**',
        'src/utils/**',
        'src/constants/**',
        'src/stores/**',
        // A new top-level source directory is invisible to coverage until it is
        // listed here -- it does not fail, it simply is not counted, and the
        // totals go UP because the denominator never grew. Three variants of
        // that trap have already been found in this file; adding a directory
        // under src/ means adding it here in the same change.
        'src/router/**',
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
      // Raised with the router work, which moved the real figures to
      // 94.18/93.72/89.81/93.96. Roughly a point of headroom each, matching
      // what these carried before -- enough that an unrelated refactor does not
      // go red, tight enough that losing a covered path does.
      thresholds: {
        statements: 93,
        branches: 92,
        functions: 89,
        lines: 93,
      },
    },
  },
});
