// Vuetify's BASE stylesheet. Without this line the app loads only the per-component CSS that
// `vite-plugin-vuetify`'s autoImport pulls in, and silently loses everything in
// `vuetify/lib/styles/main.css`:
//
//   * the `:root` custom properties, including `--v-theme-overlay-multiplier`. Every hover rule is
//     `opacity: calc(var(--v-hover-opacity) * var(--v-theme-overlay-multiplier))`, and an undefined
//     variable makes that invalid at computed-value time, so opacity falls back to its initial `1`.
//     The overlay is `currentColor`, so hovering a tab painted a SOLID WHITE block over white text
//     and the label became unreadable.
//   * the CSS reset. Without `body { margin: 0 }` the UA's 8px margin stayed, insetting the app while
//     the fixed app bar and drawer sat at true `left: 0` -- an unpainted white strip down the left edge.
//   * every utility class (`text-center`, `justify-center`, `fill-height`, `ma-*`, `pa-*`, `d-flex`,
//     the typography scale). They did not fail loudly; they resolved to nothing, so layouts written
//     with them simply did not apply.
//   * the `@layer` ordering. Vuetify 4 puts component CSS in a layer, and UNLAYERED rules beat every
//     layered rule regardless of specificity, so this repo's own `.v-tab` / `.v-label` overrides were
//     overriding far more than intended.
//
// `autoImport: true` in vite.config.mjs does NOT cover this: the plugin registers a styles plugin
// only when its `styles` option is set, and the default leaves the base sheet to the application.
// Shipped without it from the 2026-07-29 Vuetify 2 -> 4 migration until 2026-08-18.
import 'vuetify/styles';

import { createVuetify } from 'vuetify';

// Components and directives are auto-imported by vite-plugin-vuetify, so they
// are deliberately not registered here.
export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    // Pinned rather than Vuetify's default of `system`. This app's own stylesheet hard-codes white
    // text on dark backgrounds, so following the visitor's OS meant a light-mode visitor got white
    // text on Vuetify's light surfaces. The design has always been dark; say so explicitly.
    defaultTheme: 'dark',
  },
});
