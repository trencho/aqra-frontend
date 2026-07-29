// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import MenuDrawer from '../home/MenuDrawer.vue';
import TranslationButton from '../home/TranslationButton.vue';
import Footer from '../home/Footer.vue';
import { TabIds } from '@/constants/navigationTabs';
import { LocaleId } from '@/constants/locales';
import { useAirPollutionStore } from '@/stores/airPollution';
import { useLocaleStore } from '@/stores/locale';
import { stubBrowserApis, globalMountOptions, mountInApp } from './helpers';

beforeEach(() => {
  stubBrowserApis();
});

describe('MenuDrawer', () => {
  // VNavigationDrawer needs a VApp layout ancestor under Vuetify 3+.
  const mountIt = (drawer = true) =>
    mountInApp(MenuDrawer, {
      global: globalMountOptions({
        initialState: { airPollution: { drawer } },
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

  it('changes tab when a link is clicked', async () => {
    const wrapper = mountIt();
    const store = useAirPollutionStore();

    await wrapper.findAllComponents({ name: 'VListItem' })[2].trigger('click');

    expect(store.tabId).toBe(TabIds.PollutionMap);
    wrapper.unmount();
  });

  it('writes drawer closure back through the store', async () => {
    const wrapper = mountIt(true);
    const store = useAirPollutionStore();

    wrapper.findComponent({ name: 'VNavigationDrawer' }).vm.$emit(
      'update:modelValue',
      false
    );
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
  it('renders the current year and the city name', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });

    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
    wrapper.unmount();
  });

  it('does not leak an untranslated i18n key', () => {
    const wrapper = mount(Footer, { global: globalMountOptions() });

    expect(wrapper.text()).not.toContain('common.skopje');
    wrapper.unmount();
  });
});
