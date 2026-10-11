/**
 * The legal and site-information pages: privacy, terms, cookies, data sources,
 * disclaimer and accessibility.
 *
 * One constant, three consumers, the same arrangement Tabs uses: the router
 * derives a route from each entry, the footer links to each, and the specs
 * iterate them. These pages are deliberately NOT tabs. Adding them to Tabs
 * would put them in the tab bar and the drawer, and would break the
 * `Record<TabId, Component>` the router keys its views on.
 *
 * Every string is an i18n key under the `legal` namespace in translations.ts,
 * so the page text exists in both locales or the parity spec fails.
 */

export const LEGAL_VERSION = '0.1';
export const LEGAL_LAST_UPDATED = '2026-10-11';

/**
 * Whether FEIT/UKIM has approved the text. Until a build sets
 * `VITE_LEGAL_PUBLISHED=true`, every page carries a draft banner and asks
 * search engines not to index it.
 *
 * A function rather than a module-level constant, so a spec can flip the flag
 * with vi.stubEnv without re-importing the module.
 */
export function isLegalPublished(): boolean {
  return import.meta.env.VITE_LEGAL_PUBLISHED === 'true';
}

export type LegalPageId =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'dataSources'
  | 'disclaimer'
  | 'accessibility';

export interface LegalLink {
  href: string;
  /** i18n key for the link text. */
  label: string;
}

export interface LegalSection {
  /** i18n key for the section heading. */
  heading: string;
  /** i18n keys, one per paragraph. */
  paragraphs: string[];
  /**
   * External references for the section, rendered as a list after the text.
   * Kept out of the sentences so the translations stay plain strings: no
   * v-html, and no markup for a translator to break.
   */
  links?: LegalLink[];
}

export interface LegalPage {
  id: LegalPageId;
  path: string;
  /** Route name. */
  name: string;
  /** i18n key for the page title and the footer link. */
  title: string;
  /** i18n key for the one-sentence summary under the title. */
  summary: string;
  sections: LegalSection[];
}

const OSM_COPYRIGHT = 'https://www.openstreetmap.org/copyright';

/**
 * The attribution the footer shows on every page. OpenWeather's ODbL terms and
 * OpenStreetMap's licence ask for visible credit where their data appears, so
 * a mention on the data-sources page alone is not enough.
 */
export const DataCredits: readonly LegalLink[] = [
  { href: 'https://openweathermap.org', label: 'footer.weather' },
  { href: 'https://pulse.eco', label: 'footer.airQuality' },
  { href: OSM_COPYRIGHT, label: 'footer.map' },
];

export const LegalPages: LegalPage[] = [
  {
    id: 'privacy',
    path: '/privacy',
    name: 'privacy',
    title: 'legal.privacyTitle',
    summary: 'legal.privacySummary',
    sections: [
      {
        heading: 'legal.privacyControllerHeading',
        paragraphs: ['legal.privacyController', 'legal.privacyContact'],
      },
      {
        heading: 'legal.privacyNotCollectedHeading',
        paragraphs: ['legal.privacyNotCollected'],
      },
      {
        heading: 'legal.privacyLogsHeading',
        paragraphs: [
          'legal.privacyLogs',
          'legal.privacyLogsPurpose',
          'legal.privacyLogsRetention',
          'legal.privacyLegalBasis',
        ],
      },
      {
        heading: 'legal.privacyRateLimitHeading',
        paragraphs: ['legal.privacyRateLimit', 'legal.privacyAppLog'],
      },
      {
        heading: 'legal.privacyThirdPartiesHeading',
        paragraphs: [
          'legal.privacyMapTiles',
          'legal.privacyFirstParty',
          'legal.privacyNoSharing',
        ],
        links: [
          {
            href: 'https://osmfoundation.org/wiki/Privacy_Policy',
            label: 'legal.linkOsmfPrivacy',
          },
        ],
      },
      {
        heading: 'legal.privacyRightsHeading',
        paragraphs: ['legal.privacyRights', 'legal.privacyComplaint'],
      },
      {
        heading: 'legal.changesHeading',
        paragraphs: ['legal.privacyChanges'],
      },
    ],
  },
  {
    id: 'terms',
    path: '/terms',
    name: 'terms',
    title: 'legal.termsTitle',
    summary: 'legal.termsSummary',
    sections: [
      {
        heading: 'legal.termsServiceHeading',
        paragraphs: ['legal.termsService'],
      },
      {
        heading: 'legal.termsApiHeading',
        paragraphs: ['legal.termsApi', 'legal.termsApiLimit'],
      },
      {
        heading: 'legal.termsWarrantyHeading',
        paragraphs: ['legal.termsWarranty', 'legal.termsLiability'],
      },
      {
        heading: 'legal.termsLicencesHeading',
        paragraphs: ['legal.termsCodeLicence', 'legal.termsDataLicence'],
        links: [
          {
            href: 'https://github.com/trencho/aqra-frontend',
            label: 'legal.linkFrontendCode',
          },
          {
            href: 'https://github.com/trencho/aqra-backend',
            label: 'legal.linkBackendCode',
          },
        ],
      },
      {
        heading: 'legal.termsLawHeading',
        paragraphs: ['legal.termsLaw'],
      },
      {
        heading: 'legal.changesHeading',
        paragraphs: ['legal.termsChanges'],
      },
    ],
  },
  {
    id: 'cookies',
    path: '/cookies',
    name: 'cookies',
    title: 'legal.cookiesTitle',
    summary: 'legal.cookiesSummary',
    sections: [
      {
        heading: 'legal.cookiesNoneHeading',
        paragraphs: [
          'legal.cookiesNone',
          'legal.cookiesNoStorage',
          'legal.cookiesApi',
          'legal.cookiesNoBanner',
        ],
      },
      {
        heading: 'legal.cookiesThirdPartyHeading',
        paragraphs: ['legal.cookiesThirdParty'],
      },
      {
        heading: 'legal.changesHeading',
        paragraphs: ['legal.cookiesChanges'],
      },
    ],
  },
  {
    id: 'dataSources',
    path: '/data-sources',
    name: 'data-sources',
    title: 'legal.dataSourcesTitle',
    summary: 'legal.dataSourcesSummary',
    sections: [
      {
        heading: 'legal.sourcePulseHeading',
        paragraphs: ['legal.sourcePulse', 'legal.sourcePulseTerms'],
        links: [{ href: 'https://pulse.eco', label: 'legal.linkPulse' }],
      },
      {
        heading: 'legal.sourceWeatherHeading',
        paragraphs: ['legal.sourceWeather', 'legal.sourceWeatherLicence'],
        links: [
          {
            href: 'https://openweathermap.org',
            label: 'legal.linkOpenWeather',
          },
          {
            href: 'https://opendatacommons.org/licenses/odbl/',
            label: 'legal.linkOdbl',
          },
        ],
      },
      {
        heading: 'legal.sourceMapHeading',
        paragraphs: ['legal.sourceMap'],
        links: [{ href: OSM_COPYRIGHT, label: 'legal.linkOsmCopyright' }],
      },
      {
        heading: 'legal.sourceForecastHeading',
        paragraphs: ['legal.sourceForecast'],
      },
    ],
  },
  {
    id: 'disclaimer',
    path: '/disclaimer',
    name: 'disclaimer',
    title: 'legal.disclaimerTitle',
    summary: 'legal.disclaimerSummary',
    sections: [
      {
        heading: 'legal.disclaimerForecastHeading',
        paragraphs: ['legal.disclaimerForecast', 'legal.disclaimerHealth'],
      },
      {
        heading: 'legal.disclaimerDataHeading',
        paragraphs: ['legal.disclaimerData'],
      },
      {
        heading: 'legal.disclaimerOfficialHeading',
        paragraphs: ['legal.disclaimerOfficial'],
        links: [
          { href: 'https://air.moepp.gov.mk', label: 'legal.linkMoepp' },
          { href: 'https://airindex.eea.europa.eu', label: 'legal.linkEea' },
        ],
      },
    ],
  },
  {
    id: 'accessibility',
    path: '/accessibility',
    name: 'accessibility',
    title: 'legal.accessibilityTitle',
    summary: 'legal.accessibilitySummary',
    sections: [
      {
        heading: 'legal.accessibilityTargetHeading',
        paragraphs: ['legal.accessibilityTarget'],
      },
      {
        heading: 'legal.accessibilityLimitsHeading',
        paragraphs: ['legal.accessibilityLimitColour'],
      },
      {
        heading: 'legal.accessibilityContactHeading',
        paragraphs: ['legal.accessibilityContact'],
        links: [
          {
            href: 'https://github.com/trencho/aqra-frontend/issues',
            label: 'legal.linkIssues',
          },
        ],
      },
      {
        heading: 'legal.accessibilityDateHeading',
        paragraphs: ['legal.accessibilityDate'],
      },
    ],
  },
];

export function legalPageById(id: LegalPageId): LegalPage {
  // Non-null for the same reason tabById is: LegalPageId is a closed union and
  // LegalPages declares one entry per member, which the legal spec asserts.
  return LegalPages.find((p) => p.id === id)!;
}
