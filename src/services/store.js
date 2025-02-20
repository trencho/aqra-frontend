import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import { modules } from '@/store';

Vue.use(Vuex);

export const store = new Store({
    modules,
});