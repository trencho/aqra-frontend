import { createI18n } from 'vue-i18n';

import { LocaleId } from '@/constants/locales';
import { translations } from '@/constants/translations';

export const i18n = createI18n({
  // Composition API mode. globalInjection keeps `$t` available in templates,
  // which every component here already uses.
  legacy: false,
  globalInjection: true,
  locale: LocaleId.en,
  fallbackLocale: LocaleId.en,
  messages: translations,
});

/**
 * Switch the active locale.
 *
 * In legacy mode `i18n.locale` was a plain assignable property. Under
 * `legacy: false` the locale lives on `i18n.global.locale`, which is a ref --
 * assigning to the object itself silently does nothing.
 */
export function setI18nLocale(localeId) {
  i18n.global.locale.value = localeId;
}
