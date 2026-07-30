/**
 * `as const` so the values are the literals 'en' | 'mk' rather than widening to
 * string. Without it the LocaleId type below is just `string`, and every
 * locale-typed field would accept any string at all.
 */
export const LocaleId = {
  en: 'en',
  mk: 'mk',
} as const;

/**
 * Shares its name with the value above deliberately: types and values occupy
 * separate namespaces, so `LocaleId.en` (value) and `locale: LocaleId` (type)
 * both read naturally.
 */
export type LocaleId = (typeof LocaleId)[keyof typeof LocaleId];
