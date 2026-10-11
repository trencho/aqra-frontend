import { describe, expect, it } from 'vitest';
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

  // Every namespace, not only `common`: the legal pages live under `legal`
  // and the footer under `footer`, and a parity check that skipped them would
  // pass while a Macedonian visitor read raw keys.
  it('defines the same keys in every locale', () => {
    const keysOf = (locale: LocaleId) =>
      Object.entries(translations[locale])
        .flatMap(([ns, messages]) =>
          Object.keys(messages).map((key) => `${ns}.${key}`)
        )
        .sort();
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

      for (const [ns, messages] of Object.entries(translations[locale])) {
        for (const key of Object.keys(messages)) {
          expect(() => t(`${ns}.${key}`)).not.toThrow();
        }
      }
    }
  });

  it.each(Object.values(Locales))(
    'renders the accessibility contact address with a real @ in %s',
    (locale) => {
      const { t } = makeI18n(locale).global;

      expect(t('legal.accessibilityContact')).toContain(
        'trenche@feit.ukim.edu.mk'
      );
    }
  );

  // DarkSky shut down in 2023 and the backend dropped it; the project
  // description kept naming it.
  it('no longer names DarkSky as a data source', () => {
    for (const locale of Object.values(Locales)) {
      expect(JSON.stringify(translations[locale])).not.toContain('DarkSky');
    }
  });
});
