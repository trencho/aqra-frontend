// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LegalPageId } from '@/constants/legal';
import { LegalPages } from '@/constants/legal';
import { LocaleId } from '@/constants/locales';
import { translations } from '@/constants/translations';
import { i18n } from '@/services/i18n';

import LegalPage from '../legal/LegalPage.vue';
import { globalMountOptions, stubBrowserApis } from './helpers';

const en = translations.en.legal ?? {};
const mk = translations.mk.legal ?? {};
const key = (k: string) => k.replace(/^legal\./, '');

const mountPage = async (pageId: LegalPageId) => {
  const wrapper = mount(LegalPage, {
    props: { pageId },
    global: globalMountOptions(),
  });
  // Put the router on the page's own path, so the sibling list can mark it.
  const page = LegalPages.find((p) => p.id === pageId);
  await wrapper.vm.$router.push(page?.path ?? '/');
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  stubBrowserApis();
});

afterEach(() => {
  vi.unstubAllEnvs();
  i18n.global.locale.value = LocaleId.en;
});

describe('LegalPage', () => {
  it.each(LegalPages.map((p) => [p.id]))(
    'renders %s with its title, summary and every section',
    async (id) => {
      const page = LegalPages.find((p) => p.id === id)!;
      const wrapper = await mountPage(id as LegalPageId);

      expect(wrapper.get('h1').text()).toBe(en[key(page.title)]);
      expect(wrapper.text()).toContain(en[key(page.summary)]);
      const headings = wrapper.findAll('h2').map((h) => h.text());
      expect(headings).toEqual(page.sections.map((s) => en[key(s.heading)]));
      expect(wrapper.text()).not.toMatch(/legal\.\w+/);
      wrapper.unmount();
    }
  );

  it.each(LegalPages.map((p) => [p.id]))(
    'renders %s in Macedonian with no raw keys',
    async (id) => {
      const page = LegalPages.find((p) => p.id === id)!;
      i18n.global.locale.value = LocaleId.mk;
      const wrapper = await mountPage(id as LegalPageId);

      expect(wrapper.get('h1').text()).toBe(mk[key(page.title)]);
      expect(wrapper.text()).not.toMatch(/legal\.\w+/);
      wrapper.unmount();
    }
  );

  it('renders each section link as a real anchor', async () => {
    const wrapper = await mountPage('dataSources');
    const hrefs = wrapper.findAll('section a').map((a) => a.attributes('href'));

    expect(hrefs).toContain('https://www.openstreetmap.org/copyright');
    expect(hrefs).toContain('https://pulse.eco');
    wrapper.unmount();
  });

  it('discloses the OpenStreetMap tile servers in the privacy policy', async () => {
    const wrapper = await mountPage('privacy');

    expect(wrapper.text()).toContain('tile.openstreetmap.org');
    expect(wrapper.text()).toContain('[FEIT DPO contact]');
    wrapper.unmount();
  });

  it('shows the version and the last-updated date', async () => {
    const wrapper = await mountPage('terms');

    expect(wrapper.text()).toContain('Version 0.1 (draft)');
    expect(wrapper.text()).toContain('Last updated: 2026-10-11');
    wrapper.unmount();
  });

  it('lists all six documents and marks the current one', async () => {
    const wrapper = await mountPage('cookies');
    const links = wrapper.findAll('nav a');

    // Distinct from the footer nav's "Site information": two landmarks with
    // one name leave a screen-reader user unable to tell them apart.
    expect(wrapper.get('nav').attributes('aria-label')).toBe(
      'Policies and statements'
    );

    expect(links.map((a) => a.attributes('href'))).toEqual(
      LegalPages.map((p) => p.path)
    );
    const current = links.filter(
      (a) => a.attributes('aria-current') === 'page'
    );
    expect(current.map((a) => a.attributes('href'))).toEqual(['/cookies']);
    wrapper.unmount();
  });

  it('names the page in the document title and restores it on leaving', async () => {
    const wrapper = await mountPage('disclaimer');

    expect(document.title).toBe('Disclaimer | AQRA');

    i18n.global.locale.value = LocaleId.mk;
    await flushPromises();
    expect(document.title).toBe('Одрекување од одговорност | AQRA');

    wrapper.unmount();
    expect(document.title).toBe('AQRA');
  });
});

describe('publication gate', () => {
  const robots = () => document.head.querySelector('meta[name="robots"]');

  it('shows the draft banner and asks crawlers not to index while unset', async () => {
    const wrapper = await mountPage('privacy');

    expect(wrapper.text()).toContain('Draft: pending review by FEIT/UKIM');
    // A static notice, not an interruption on every navigation.
    expect(wrapper.find('[role="note"]').exists()).toBe(true);
    expect(robots()?.getAttribute('content')).toBe('noindex');

    wrapper.unmount();
    expect(robots()).toBeNull();
  });

  it('translates the banner', async () => {
    i18n.global.locale.value = LocaleId.mk;
    const wrapper = await mountPage('privacy');

    expect(wrapper.text()).toContain('Нацрт: се чека преглед од ФЕИТ/УКИМ');
    wrapper.unmount();
  });

  it('drops the banner, the draft label and noindex once published', async () => {
    vi.stubEnv('VITE_LEGAL_PUBLISHED', 'true');
    const wrapper = await mountPage('privacy');

    expect(wrapper.text()).not.toContain('Draft');
    expect(wrapper.text()).toContain('Version 0.1');
    expect(wrapper.text()).not.toContain('(draft)');
    expect(robots()).toBeNull();
    wrapper.unmount();
  });
});
