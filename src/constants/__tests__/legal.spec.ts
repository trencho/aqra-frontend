import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LegalPageId } from '../legal';
import {
  DataCredits,
  isLegalPublished,
  legalPageById,
  LegalPages,
} from '../legal';
import { LocaleId } from '../locales';
import { translations } from '../translations';

/** Every i18n key the legal definitions point at. */
const referencedKeys = (): string[] => [
  ...LegalPages.flatMap((page) => [
    page.title,
    page.summary,
    ...page.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.links ?? []).map((link) => link.label),
    ]),
  ]),
  ...DataCredits.map((credit) => credit.label),
];

const lookup = (locale: LocaleId, key: string): string | undefined => {
  const [ns, name] = key.split('.');
  return translations[locale][ns ?? '']?.[name ?? ''];
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('LegalPages', () => {
  it('declares the six pages, each once', () => {
    const ids: LegalPageId[] = [
      'privacy',
      'terms',
      'cookies',
      'dataSources',
      'disclaimer',
      'accessibility',
    ];

    expect(LegalPages.map((p) => p.id).sort()).toEqual([...ids].sort());
    expect(new Set(LegalPages.map((p) => p.path)).size).toBe(ids.length);
    expect(new Set(LegalPages.map((p) => p.name)).size).toBe(ids.length);
  });

  it.each(LegalPages.map((p) => [p.id, p]))('finds %s by id', (id, page) => {
    expect(legalPageById(id as LegalPageId)).toBe(page);
  });

  // The parity spec proves both locales carry the same keys; this proves the
  // definitions only point at keys that exist, so no page renders a raw key.
  it.each(Object.values(LocaleId))(
    'resolves every referenced key in %s',
    (locale) => {
      const missing = referencedKeys().filter(
        (key) => !lookup(locale, key)?.trim()
      );

      expect(missing).toEqual([]);
    }
  );

  it('links only to https addresses', () => {
    const hrefs = [
      ...LegalPages.flatMap((p) =>
        p.sections.flatMap((s) => (s.links ?? []).map((l) => l.href))
      ),
      ...DataCredits.map((c) => c.href),
    ];

    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\//);
    }
  });
});

describe('DataCredits', () => {
  // OpenWeather's ODbL terms and OpenStreetMap's licence ask for this exact
  // attribution where the data appears.
  it('credits OpenWeather, pulse.eco and OpenStreetMap in English', () => {
    const texts = DataCredits.map((c) => lookup(LocaleId.en, c.label));

    expect(texts).toEqual([
      'Weather data © OpenWeather',
      'Air-quality data: pulse.eco',
      '© OpenStreetMap contributors',
    ]);
  });

  it('links the map credit to the OpenStreetMap copyright page', () => {
    expect(DataCredits.map((c) => c.href)).toContain(
      'https://www.openstreetmap.org/copyright'
    );
  });
});

describe('isLegalPublished', () => {
  it('treats an unset flag as a draft', () => {
    vi.stubEnv('VITE_LEGAL_PUBLISHED', undefined);

    expect(isLegalPublished()).toBe(false);
  });

  it.each(['false', '1', 'TRUE', ''])('treats %j as a draft', (value) => {
    vi.stubEnv('VITE_LEGAL_PUBLISHED', value);

    expect(isLegalPublished()).toBe(false);
  });

  it('publishes only on the string true', () => {
    vi.stubEnv('VITE_LEGAL_PUBLISHED', 'true');

    expect(isLegalPublished()).toBe(true);
  });
});
