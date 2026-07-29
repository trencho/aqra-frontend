import { defineStore } from 'pinia';
import { LocaleId } from '@/constants/locales';
import { setI18nLocale } from '@/services/i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: LocaleId.en,
  }),

  actions: {
    setLocale(localeId) {
      setI18nLocale(localeId);
      this.locale = localeId;
    },
  },
});
