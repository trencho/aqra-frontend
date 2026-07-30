// @vitest-environment jsdom

/**
 * Migration smoke test.
 *
 * A green `vite build` proves the modules resolve; it does not prove the app
 * boots. This mounts the real component tree with the real Vuetify, i18n and
 * Pinia plugins, which is what catches the wiring mistakes the Vue 2 -> 3
 * migration can leave behind: a removed Vuetify component, an activator slot
 * still using the `{ on, attrs }` contract, a store accessed the Vuex way, or
 * `$t` unavailable because i18n was registered in legacy mode.
 */
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App.vue';
import { TabIds } from '@/constants/navigationTabs';
import { i18n } from '@/services/i18n';
import { vuetify } from '@/services/vuetify';
import { useAirPollutionStore } from '@/stores/airPollution';

// Leaflet needs real layout; the map component is exercised separately.
vi.mock('@/utils/createMap', () => ({
  createBaseLayer: vi.fn(),
  createCityBoundaries: vi.fn(() => []),
  mapCities: vi.fn(() => []),
  mapSensorsInCities: vi.fn(() => []),
  removeLayer: vi.fn(() => null),
}));

vi.mock('@/services/api', () => ({
  aqra: {
    getDataForAllCities: vi.fn(() => Promise.resolve({ status: 200, data: [] })),
  },
}));

const mountApp = () =>
  mount(App, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn, stubActions: false }),
        i18n,
        vuetify,
      ],
      stubs: {
        // jsdom has no canvas; the chart is covered by its own test.
        LineChart: true,
      },
    },
  });

beforeEach(() => {
  // Vuetify's display composable reads matchMedia, which jsdom lacks.
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.scrollTo = vi.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('App mounts under Vue 3', () => {
  it('renders without throwing', () => {
    const wrapper = mountApp();

    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders the Vuetify application root', () => {
    const wrapper = mountApp();

    // v-application is Vuetify 3's root class; its absence means VApp did not
    // resolve and the whole layout is unstyled.
    expect(wrapper.find('.v-application').exists()).toBe(true);
    wrapper.unmount();
  });

  it('resolves translations through vue-i18n 11, not raw keys', () => {
    const wrapper = mountApp();

    // Under a misconfigured i18n, $t returns the key itself. Seeing the key
    // leak into the DOM is the failure this guards.
    expect(wrapper.text()).not.toContain('common.home');
    wrapper.unmount();
  });

  it('starts on the Home tab and reads state from the Pinia store', () => {
    const wrapper = mountApp();
    const store = useAirPollutionStore();

    expect(store.tabId).toBe(TabIds.Home);
    wrapper.unmount();
  });

  it('switches tabs through the store action', async () => {
    const wrapper = mountApp();
    const store = useAirPollutionStore();

    store.changeTab(TabIds.SwaggerDocumentation);
    await wrapper.vm.$nextTick();

    expect(store.tabId).toBe(TabIds.SwaggerDocumentation);
    // The Swagger tab is a plain <iframe> now that vue-iframes is gone.
    expect(wrapper.find('iframe').exists()).toBe(true);
    wrapper.unmount();
  });

  it('closes the drawer when the tab changes', () => {
    const wrapper = mountApp();
    const store = useAirPollutionStore();

    store.setDrawer(true);
    expect(store.drawer).toBe(true);

    store.changeTab(TabIds.Statistics);
    expect(store.drawer).toBe(false);
    wrapper.unmount();
  });
});
