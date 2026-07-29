import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // mirrors the `@` alias Vue CLI provides; becomes vite.config.js's alias
      // once the build moves to Vite.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // These tests are deliberately framework-independent pure logic, so they
    // need no DOM. Component tests added later switch this to 'jsdom'.
    environment: 'node',
    include: ['src/**/__tests__/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      include: [
        'src/classes/**',
        'src/services/**',
        'src/utils/**',
        'src/constants/**',
      ],
      reporter: ['text', 'lcov'],
      // Set to what is ACTUALLY achieved, not to an aspiration -- a threshold
      // above the real number fails from day one and gets switched off, while
      // one at the real number catches regressions from day one.
      //
      // The shortfall is entirely code this phase deliberately defers:
      // utils/createMap.js (needs a mocked Leaflet), services/i18n.js and
      // services/store.js (framework wiring), and the data-only constants.
      // Phase 7 covers them and raises these numbers.
      thresholds: {
        statements: 54,
        branches: 54,
        functions: 55,
        lines: 53,
      },
    },
  },
});
