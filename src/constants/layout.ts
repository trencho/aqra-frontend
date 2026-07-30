/**
 * Height of the application bar, in pixels.
 *
 * Must stay in sync with the `height` prop on the VAppBar in HomePage.vue.
 * Vuetify 2 reported this at runtime via `$vuetify.application.top`; Vuetify 3
 * removed that in favour of the `useLayout()` composable, which cannot be
 * called from an Options API component -- so the value is shared here instead
 * of being read from the framework.
 */
export const APP_BAR_HEIGHT = 60;

/** `calc()` expression for a full-viewport area sitting below the app bar. */
export const belowAppBar = (): string => `calc(100vh - ${APP_BAR_HEIGHT}px)`;
