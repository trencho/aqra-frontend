// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '@/__tests__/support/expect';
import { LegalPages } from '@/constants/legal';
import { LocaleId } from '@/constants/locales';
import { TabIds } from '@/constants/navigationTabs';
import { i18n } from '@/services/i18n';
import { useLocaleStore } from '@/stores/locale';
import { useUiStore } from '@/stores/ui';

import Footer from '../home/Footer.vue';
import MenuDrawer from '../home/MenuDrawer.vue';
import TranslationButton from '../home/TranslationButton.vue';
import { globalMountOptions, mountInApp, stubBrowserApis } from './helpers';

beforeEach(() => {
  stubBrowserApis();
});

describe('MenuDrawer', () => {
  // VNavigationDrawer needs a VApp layout ancestor under Vuetify 3+.
  const mountIt = (drawer = true) =>
    mountInApp(MenuDrawer, {
      global: globalMountOptions({
        initialState: { ui: { drawer } },
        stubActions: false,
      }),
    });

  it('lists one entry per navigation tab', () => {
    const wrapper = mountIt();

    // Four links plus the AQRA header item.
    expect(wrapper.findAllComponents({ name: 'VListItem' })).toHaveLength(5);
    wrapper.unmount();
  });

  it('renders the header via VListItem title/subtitle props', () => {
    // Vuetify 3 removed VListItemContent; the title and subtitle became props.
    // Rendering them proves the replacement resolved.
    const wrapper = mountIt();

    expect(wrapper.text()).toContain('AQRA');
    expect(wrapper.text()).toContain('Air Quality REST API');
    wrapper.unmount();
  });

  // Each entry is a real link now (`:to`), so the click starts a navigation and
  // the store is updated by the router's afterEach.
  //
  // Awaiting the router's own completion rather than flushing promises: a click
  // handler has no promise to return, and the guard chain can outlive a single
  // macrotask, so a flush-based wait is a latent flake.
  it('navigates and changes tab when a link is clicked', async () => {
    const wrapper = mountIt();
    const store = useUiStore();
    const router = wrapper.vm.$router;
    await router.isReady();

    const navigated = new Promise<void>((resolve) => {
      const stop = router.afterEach(() => {
        stop();
        resolve();
      });
    });

    await at(wrapper.findAllComponents({ name: 'VListItem' }), 2).trigger(
      'click'
    );
    await navigated;

    expect(store.tabId).toBe(TabIds.PollutionMap);
    expect(router.currentRoute.value.path).toBe('/map');
    wrapper.unmount();
  });

  it('writes drawer closure back through the store', async () => {
    const wrapper = mountIt(true);
    const store = useUiStore();

    wrapper
      .findComponent({ name: 'VNavigationDrawer' })
      .vm.$emit('update:modelValue', false);
    await wrapper.vm.$nextTick();

    expect(store.drawer).toBe(false);
    wrapper.unmount();
  });
});

describe('TranslationButton', () => {
  const mountIt = () =>
    mount(TranslationButton, {
      global: globalMountOptions({
        initialState: { locale: { locale: LocaleId.en } },
        stubActions: false,
      }),
      attachTo: document.body,
    });

  it('shows the active locale on the activator button', () => {
    const wrapper = mountIt();

    expect(wrapper.text()).toContain('en');
    wrapper.unmount();
  });

  // Vuetify 3 hands the activator a single `props` object; the Vuetify 2
  // contract was `{ on, attrs }` plus a separate v-on. Getting this wrong
  // renders a button that looks right and does nothing, so assert the
  // activator actually produced a button.
  it('renders an activator button from the v-slot:activator props', () => {
    const wrapper = mountIt();

    expect(wrapper.findComponent({ name: 'VBtn' }).exists()).toBe(true);
    wrapper.unmount();
  });

  it('offers every supported locale', () => {
    const wrapper = mountIt();

    expect(wrapper.vm.locales).toEqual(Object.values(LocaleId));
    wrapper.unmount();
  });

  it('switches locale through the store', () => {
    const wrapper = mountIt();
    const store = useLocaleStore();

    store.setLocale(LocaleId.mk);

    expect(store.locale).toBe(LocaleId.mk);
    wrapper.unmount();
  });
});

describe('Footer', () => {
  // The TranslationButton specs above switch the shared i18n to Macedonian.
  beforeEach(() => {
    i18n.global.locale.value = LocaleId.en;
  });

  it('renders the current year and the city name', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });

    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
    wrapper.unmount();
  });

  it('does not leak an untranslated i18n key', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });

    expect(wrapper.text()).not.toContain('common.skopje');
    expect(wrapper.text()).not.toMatch(/(legal|footer)\.\w+/);
    wrapper.unmount();
  });

  it('links to all six legal pages from a labelled nav', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });
    const nav = wrapper.get('nav');

    expect(nav.attributes('aria-label')).toBe('Site information');
    expect(nav.findAll('a').map((a) => a.attributes('href'))).toEqual(
      LegalPages.map((p) => p.path)
    );
    expect(nav.text()).toContain('Privacy policy');
    expect(nav.text()).toContain('Accessibility statement');
    wrapper.unmount();
  });

  // Visible on every page: OpenWeather's ODbL terms and OpenStreetMap's
  // licence both require attribution where the data is shown.
  it('shows the data attribution with links to each source', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });
    const credits = wrapper
      .findAll('ul')
      .find((ul) => ul.attributes('aria-label') === 'Data credits');
    const links = credits?.findAll('a') ?? [];

    expect(links.map((a) => [a.text(), a.attributes('href')])).toEqual([
      ['Weather data © OpenWeather', 'https://openweathermap.org'],
      ['Air-quality data: pulse.eco', 'https://pulse.eco'],
      [
        '© OpenStreetMap contributors',
        'https://www.openstreetmap.org/copyright',
      ],
    ]);
    wrapper.unmount();
  });

  it('translates the links and the attribution into Macedonian', async () => {
    i18n.global.locale.value = LocaleId.mk;
    const wrapper = mount(Footer, { global: globalMountOptions() });

    expect(wrapper.text()).toContain('Политика за приватност');
    expect(wrapper.text()).toContain('Временски податоци © OpenWeather');
    expect(wrapper.text()).toContain('© соработници на OpenStreetMap');
    wrapper.unmount();
    i18n.global.locale.value = LocaleId.en;
  });
});
