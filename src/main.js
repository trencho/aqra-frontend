import { createApp } from 'vue';

import L from 'leaflet';
import 'leaflet.heat';
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
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

createApp(App)
  .component('FontAwesomeIcon', FontAwesomeIcon)
  .use(pinia)
  .use(i18n)
  .use(vuetify)
  .mount('#app');
