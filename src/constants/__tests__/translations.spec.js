import { describe, it, expect } from 'vitest';
import { createI18n } from 'vue-i18n';

import { translations } from '../translations';
import { LocaleId } from '../locales';

const makeI18n = (locale) =>
  createI18n({
    legacy: false,
    locale,
    fallbackLocale: LocaleId.en,
    messages: translations,
  });

describe('translations', () => {
  it('provides every supported locale', () => {
    expect(Object.keys(translations).sort()).toEqual(
      Object.values(LocaleId).sort()
    );
  });

  it('defines the same keys in every locale', () => {
    const keysOf = (locale) => Object.keys(translations[locale].common).sort();
    const [first, ...rest] = Object.values(LocaleId);

    for (const locale of rest) {
      expect(keysOf(locale)).toEqual(keysOf(first));
    }
  });

  // vue-i18n 9+ reads `@` as linked-message syntax, so a bare email address in
  // a message throws "Invalid linked format" at compile time -- it was
  // perfectly legal in vue-i18n 8. The address is escaped as {'@'}; this test
  // proves the escape resolves back to a real address rather than shipping the
  // literal braces to users.
  it.each(Object.values(LocaleId))(
    'renders the contact email as a real address in %s',
    (locale) => {
      const { t } = makeI18n(locale).global;

      expect(t('common.email')).toBe('trenche@feit.ukim.edu.mk');
      expect(t('common.email')).not.toContain('{');
    }
  );

  it('compiles every message without a linked-format error', () => {
    // Any other stray @ or | in a message would throw here.
    for (const locale of Object.values(LocaleId)) {
      const { t } = makeI18n(locale).global;

      for (const key of Object.keys(translations[locale].common)) {
        expect(() => t(`common.${key}`)).not.toThrow();
      }
    }
  });
});
