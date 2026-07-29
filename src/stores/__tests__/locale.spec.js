import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/services/i18n', () => ({
  setI18nLocale: vi.fn(),
}));

const { setI18nLocale } = await import('@/services/i18n');
const { useLocaleStore } = await import('../locale');
const { LocaleId } = await import('@/constants/locales');

let store;

beforeEach(() => {
  setActivePinia(createPinia());
  store = useLocaleStore();
  vi.clearAllMocks();
});

describe('locale store', () => {
  it('defaults to English', () => {
    expect(store.locale).toBe(LocaleId.en);
  });

  it('records the selected locale', () => {
    store.setLocale(LocaleId.mk);

    expect(store.locale).toBe(LocaleId.mk);
  });

  // The store used to assign i18n.locale directly. Under vue-i18n's
  // Composition API mode the locale is a ref on i18n.global, so a direct
  // assignment silently does nothing and the UI never switches language.
  // Routing it through setI18nLocale is what makes the switch take effect.
  it('pushes the change into vue-i18n', () => {
    store.setLocale(LocaleId.mk);

    expect(setI18nLocale).toHaveBeenCalledWith(LocaleId.mk);
  });

  it('switches back and forth', () => {
    store.setLocale(LocaleId.mk);
    store.setLocale(LocaleId.en);

    expect(store.locale).toBe(LocaleId.en);
    expect(setI18nLocale).toHaveBeenLastCalledWith(LocaleId.en);
  });
});
