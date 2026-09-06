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
      // Everything under src/, minus what emits no runtime code. This used to
      // be a hand-maintained allow-list of eight entries, and the list was
      // wrong: `src/App.vue` was absent from all of them, so it was mounted by
      // seven tests in src/__tests__/app-mount.spec.ts and counted in none.
      //
      // Four variants of that trap had already been found and commented in this
      // file, and every comment warned about a new top-level *directory*. The
      // live case was a *file* sitting directly under src/, which none of the
      // warnings covered and no amount of care about them would have caught.
      //
      // An allow-list fails silently in the flattering direction: uncounted
      // code does not fail the build, it just never joins the denominator, so
      // the percentages go UP. A deny-list of things that emit nothing fails
      // the other way -- add a directory and it lands in coverage uninvited,
      // which is visible immediately.
      include: ['src/**'],
      exclude: [
        'src/**/__tests__/**',
        // Type-only: erased at compile time, emits nothing to instrument.
        'src/types/**',
        'src/**/*.d.ts',
      ],
      reporter: ['text', 'lcov'],
      // Set to what is ACTUALLY achieved, not to an aspiration -- a threshold
      // above the real number fails from day one and gets switched off, while
      // one at the real number catches regressions from day one.
      //
      // Components are included in the denominator now that they are tested,
      // so this is the honest whole-app figure rather than a flattering subset.
      //
      // What is still uncovered is deliberate: services/store.ts (a one-line
      // createPinia call) and the branches of TranslationButton's menu that
      // only open on real pointer interaction.
      //
      // This sentence used to also claim "Map.vue's dead decrement/increment/
      // playSlider (Phase 8 deletes them)". Both halves were wrong, and the
      // sentence invited someone to act on it: those three live in
      // SliderFilter.vue, not Map.vue, and they are not dead -- each is bound
      // to @click in that component's template (lines 29, 41, 51). Deleting
      // them would remove working slider controls.
      //
      // Re-measured after `include` became 'src/**'. App.vue joined the
      // denominator (3 statements, all covered) and the figures moved to
      // 94.36/93.49/90.03/94.16, from 94.29/93.49/89.92/94.08. Up, not down:
      // the file it had been omitting was fully exercised, which is why an
      // allow-list gap is so easy to miss -- it flatters the result.
      //
      // The pins below are unchanged, and that is the measurement rather than
      // an oversight. The convention is roughly a point of headroom each, the
      // movement was under a seventh of a point, and re-deriving from the new
      // figures lands on the same four numbers. Enough that an unrelated
      // refactor does not go red, tight enough that losing a covered path does.
      thresholds: {
        statements: 93,
        branches: 92,
        functions: 89,
        lines: 93,
      },
    },
  },
});
