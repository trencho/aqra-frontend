import App from './App.vue'

import Vue from 'vue'
import Vuetify from 'vuetify';

import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import VueIframe from 'vue-iframes/dist/vue-iframes.ssr';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core';
import { store } from './services/store';
import { i18n } from './services/i18n';
import styles from './styles/styles.scss';

import { faGithub, faLinkedin, } from '@fortawesome/free-brands-svg-icons';
import { faAnglesLeft, faAnglesRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';

library.add(faLinkedin);
library.add(faGithub);
library.add(faEnvelope);
library.add(faAnglesRight);
library.add(faAnglesLeft);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
})

Vue.config.productionTip = false
Vue.use(Vuetify);
Vue.use(VueIframe);
Vue.component('FontAwesomeIcon', FontAwesomeIcon)

new Vue({
    i18n,
    store,
    styles,
    vuetify: new Vuetify(
        // {
        //     theme: { dark: window.matchMedia('(prefers-color-scheme: dark)').matches }
        // }
    ),
    render: h => h(App),
}).$mount('#app')