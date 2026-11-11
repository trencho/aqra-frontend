/* eslint-disable simple-import-sort/imports --
 * The import order in this file is load-bearing and must not be sorted.
 *
 * leaflet.heat 1.0.0 is an ES module that imports Leaflet itself, so it no
 * longer has to load after `import L from 'leaflet'` and no longer appears
 * here: utils/createMap.ts imports its HeatLayer class directly.
 *
 * The stylesheet imports below are ordered for the cascade: styles.scss
 * overrides the Material Design Icons sheet.
 */
import { createApp } from 'vue';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import {
  faAnglesLeft,
  faAnglesRight,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';

import App from './App.vue';
import { router } from './router';
import { pinia } from './services/store';
import { i18n } from './services/i18n';
import { vuetify } from './services/vuetify';

import '@mdi/font/css/materialdesignicons.css';
import './styles/styles.scss';

library.add(faLinkedin);
library.add(faGithub);
library.add(faEnvelope);
library.add(faAnglesRight);
library.add(faAnglesLeft);

// Leaflet resolves its default marker images relative to its own CSS, which
// does not survive bundling; point them at the imported asset URLs instead.
// Framework-independent -- carried over verbatim from the Vue 2 entry point.
//
// `_getIconUrl` is a Leaflet internal that @types/leaflet does not declare, so
// src/types/leaflet.d.ts augments Icon.Default with it (as optional, which is
// what makes `delete` legal) rather than suppressing the error.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// pinia before router: the router's afterEach resolves the store, so the active
// pinia has to exist by the time the first navigation is dispatched.
createApp(App)
  .component('FontAwesomeIcon', FontAwesomeIcon)
  .use(pinia)
  .use(router)
  .use(i18n)
  .use(vuetify)
  .mount('#app');
