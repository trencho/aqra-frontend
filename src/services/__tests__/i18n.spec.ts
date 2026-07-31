// @vitest-environment jsdom

/**
 * These tests deliberately exercise the REAL setI18nLocale.
 *
 * `locale.spec.ts` mocks `@/services/i18n` wholesale, so it can prove the store
 * calls setI18nLocale but nothing about what setI18nLocale does. That left the
 * `<html lang>` behaviour below with no coverage at all, from either side.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { LocaleId } from '@/constants/locales';
import { i18n, setI18nLocale } from '@/services/i18n';

beforeEach(() => {
  document.documentElement.lang = 'en';
  setI18nLocale(LocaleId.en);
});

describe('setI18nLocale', () => {
  it('switches the active i18n locale', () => {
    setI18nLocale(LocaleId.mk);

    expect(i18n.global.locale.value).toBe(LocaleId.mk);
  });

  /**
   * index.html hardcodes lang="en". Without this, a screen reader keeps applying
   * English pronunciation rules to Macedonian text for the whole session -- and
   * no automated accessibility checker flags it, because "en" is a valid value,
   * just the wrong one. axe reported zero violations on this page while the bug
   * was live, which is exactly why it needs a test rather than a scan.
   */
  it('keeps <html lang> in step with the locale', () => {
    setI18nLocale(LocaleId.mk);

    expect(document.documentElement.lang).toBe(LocaleId.mk);
  });

  it('switches <html lang> back when returning to English', () => {
    setI18nLocale(LocaleId.mk);
    setI18nLocale(LocaleId.en);

    expect(document.documentElement.lang).toBe(LocaleId.en);
  });
});
