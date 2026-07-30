import { describe, expect,it } from 'vitest';
import { createI18n } from 'vue-i18n';

import { at } from '@/__tests__/support/expect';

import type { LocaleId } from '../locales';
import { LocaleId as Locales } from '../locales';
import { translations } from '../translations';

const makeI18n = (locale: LocaleId) =>
  createI18n({
    legacy: false,
    locale,
    fallbackLocale: Locales.en,
    messages: translations,
  });

describe('translations', () => {
  it('provides every supported locale', () => {
    expect(Object.keys(translations).sort()).toEqual(
      Object.values(Locales).sort()
    );
  });

  it('defines the same keys in every locale', () => {
    const keysOf = (locale: LocaleId) =>
      Object.keys(translations[locale].common).sort();
    // `at` rather than a destructure: noUncheckedIndexedAccess types the first
    // element as possibly undefined, and this test is meaningless if the locale
    // list is empty -- better to fail saying so.
    const locales = Object.values(Locales);
    const first = at(locales, 0);

    for (const locale of locales.slice(1)) {
      expect(keysOf(locale)).toEqual(keysOf(first));
    }
  });

  // vue-i18n 9+ reads `@` as linked-message syntax, so a bare email address in
  // a message throws "Invalid linked format" at compile time -- it was
  // perfectly legal in vue-i18n 8. The address is escaped as {'@'}; this test
  // proves the escape resolves back to a real address rather than shipping the
  // literal braces to users.
  it.each(Object.values(Locales))(
    'renders the contact email as a real address in %s',
    (locale) => {
      const { t } = makeI18n(locale).global;

      expect(t('common.email')).toBe('trenche@feit.ukim.edu.mk');
      expect(t('common.email')).not.toContain('{');
    }
  );

  it('compiles every message without a linked-format error', () => {
    // Any other stray @ or | in a message would throw here.
    for (const locale of Object.values(Locales)) {
      const { t } = makeI18n(locale).global;

      for (const key of Object.keys(translations[locale].common)) {
        expect(() => t(`common.${key}`)).not.toThrow();
      }
    }
  });
});
