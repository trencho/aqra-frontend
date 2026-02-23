import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { LocaleId } from '@/constants/locales';
import { translations } from '@/constants/translations';

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: LocaleId.en,
  messages: translations,
});
