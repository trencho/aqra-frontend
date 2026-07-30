import { defineStore } from 'pinia';

import type { LocaleId } from '@/constants/locales';
import { LocaleId as Locales } from '@/constants/locales';
import { setI18nLocale } from '@/services/i18n';

interface LocaleState {
  locale: LocaleId;
}

export const useLocaleStore = defineStore('locale', {
  // Annotated rather than inferred: LocaleId is `as const`, so `Locales.en`
  // infers the literal 'en' and the state would only ever accept 'en'.
  state: (): LocaleState => ({
    locale: Locales.en,
  }),

  actions: {
    setLocale(localeId: LocaleId) {
      setI18nLocale(localeId);
      this.locale = localeId;
    },
  },
});
