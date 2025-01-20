import {i18n} from '@/services/i18n';

const state = {
  locale: 'en'
};

const actions = {
  async setLocale({commit}, locale) {
    commit('setLocale', locale);
  }
};

const mutations = {
  setLocale(state, localeId) {
    i18n.locale = localeId;
    state.locale = localeId;
  }
};

export const locale = {
  namespaced: true,

  state,
  actions,
  mutations,
};