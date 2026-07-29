import { createVuetify } from 'vuetify';

// Components and directives are auto-imported by vite-plugin-vuetify, so they
// are deliberately not registered here.
export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
});
