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
import {mount } from '@vue/test-utils';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/App.vue';
import { testRouter } from '@/components/__tests__/helpers';
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
        // Which view renders is the router's decision now, so the real tree
        // does not mount without one. A fresh memory router per call keeps
        // each test's navigation out of the next one's starting location.
        testRouter(),
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

  // Navigating is what switches tabs now; the store mirrors the route via the
  // router's afterEach rather than driving it. This used to call changeTab
  // directly, which no longer changes what renders -- and that is the point of
  // the change, so the test asserts both halves: the view swaps *and* the store
  // agrees afterwards.
  it('switches tabs by navigating, and syncs the store to the route', async () => {
    const wrapper = mountApp();
    const store = useAirPollutionStore();

    await wrapper.vm.$router.push('/api-docs');
    await wrapper.vm.$nextTick();

    expect(store.tabId).toBe(TabIds.SwaggerDocumentation);
    // The Swagger tab is a plain <iframe> now that vue-iframes is gone.
    expect(wrapper.find('iframe').exists()).toBe(true);
    wrapper.unmount();
  });

  // The other direction: selecting a tab in the bar has to change the URL, not
  // just the store, or the tab bar and the address bar drift apart. VTabs is
  // v-model driven, so this is what a click on a tab ultimately emits.
  it('changes the URL when a tab is selected in the tab bar', async () => {
    const wrapper = mountApp();
    const router = wrapper.vm.$router;
    // Navigating before the initial navigation has settled races with it.
    await router.isReady();

    // HomePage's activeTab setter calls `void $router.push(...)`, so there is
    // no promise to await from out here -- and flushPromises is NOT enough:
    // the guard chain outlives a single macrotask, and the assertion then reads
    // the old path and fails for a reason that has nothing to do with the code.
    // Hook the router's own completion instead, which is exact.
    const navigated = new Promise<void>((resolve) => {
      const stop = router.afterEach(() => {
        stop();
        resolve();
      });
    });

    wrapper
      .findComponent({ name: 'VTabs' })
      .vm.$emit('update:modelValue', TabIds.Statistics);
    await navigated;

    expect(router.currentRoute.value.path).toBe('/statistics');
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
