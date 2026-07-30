// @vitest-environment jsdom

/**
 * The user-visible failure path.
 *
 * Before Phase 8 there was none: every store action checked
 * `result.status === 200` and did nothing otherwise, while axios rejects on
 * 4xx/5xx rather than resolving. The rejection escaped the action entirely --
 * there was no try/catch anywhere in src/ -- so a failed request left the UI
 * sitting in its loading state with the only evidence in the browser console.
 */
import type { AxiosResponse } from 'axios';
import { createPinia,setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { axiosResponse } from '@/__tests__/support/expect';
import type { ApiCity } from '@/types/api';

vi.mock('@/services/api', () => ({
  aqra: {
    getDataForAllCities: vi.fn(),
    getAvailableSensorsForCity: vi.fn(),
    getForecastBySpecificCoordinates: vi.fn(),
    getForecastForSpecificSensor: vi.fn(),
    getDataForAllAvailablePollutantsBySensorId: vi.fn(),
    getDataForHistoricalPollution: vi.fn(),
  },
}));

vi.mock('@/utils/createMap', () => ({
  createBaseLayer: vi.fn(),
  createCityBoundaries: vi.fn(() => []),
  mapCities: vi.fn(() => []),
  mapSensorsInCities: vi.fn(() => []),
  removeLayer: vi.fn(() => null),
  createHeatLayer: vi.fn(() => ({ heatLayer: 'h', time: [] })),
  createHeatLayers: vi.fn(() => ({ heatLayer: 'h', time: [] })),
  createSensorHeatLayers: vi.fn(() => ({ heatLayer: 'h', time: [] })),
}));

const { aqra } = await import('@/services/api');
const HomePage = (await import('../home/HomePage.vue')).default;
const { useAirPollutionStore } = await import('@/stores/airPollution');
const { i18n } = await import('@/services/i18n');
const { vuetify } = await import('@/services/vuetify');
const { stubBrowserApis, mountInApp } = await import('./helpers');

// Typed rather than left as `any`: this spec drives the real store actions,
// so `store.error`, `store.isLoading` and `store.pending` are exactly what it
// is asserting about, and they should be checked.
let store: ReturnType<typeof useAirPollutionStore>;

// HomePage renders VAppBar and VMain, which inject their layout from VApp and
// throw "Could not find injected layout" if mounted standalone under
// Vuetify 3+. Pinia is activated globally in beforeEach, so only i18n and
// vuetify need registering here.
const mountHome = () =>
  mountInApp(HomePage, {
    global: { plugins: [i18n, vuetify] },
  });

beforeEach(() => {
  stubBrowserApis();
  setActivePinia(createPinia());
  store = useAirPollutionStore();
  vi.clearAllMocks();
  vi.mocked(aqra.getDataForAllCities).mockResolvedValue(axiosResponse([], 200));
});

describe('error surfacing', () => {
  it('shows nothing while requests are succeeding', () => {
    const wrapper = mountHome();

    expect(store.hasError).toBe(false);
    expect(wrapper.text()).not.toContain('Network Error');
    wrapper.unmount();
  });

  it('renders the failure message once a request fails', async () => {
    const wrapper = mountHome();

    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('Network Error'));
    await store.getCities();
    await wrapper.vm.$nextTick();

    expect(store.hasError).toBe(true);
    expect(document.body.textContent).toContain('Network Error');
    wrapper.unmount();
  });

  it('offers a dismiss action that clears the error', async () => {
    const wrapper = mountHome();
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('Network Error'));
    await store.getCities();
    await wrapper.vm.$nextTick();

    store.clearError();
    await wrapper.vm.$nextTick();

    expect(store.hasError).toBe(false);
    wrapper.unmount();
  });

  it('does not stay stuck after a later request succeeds', async () => {
    const wrapper = mountHome();
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('Network Error'));
    await store.getCities();
    expect(store.hasError).toBe(true);

    vi.mocked(aqra.getDataForAllCities).mockResolvedValue(axiosResponse([], 200));
    await store.getCities();
    await wrapper.vm.$nextTick();

    expect(store.hasError).toBe(false);
    wrapper.unmount();
  });

  it('reports a non-200 as well as a rejection', async () => {
    const wrapper = mountHome();

    vi.mocked(aqra.getDataForAllCities).mockResolvedValue(axiosResponse(null, 500));
    await store.getCities();

    expect(store.error).toContain('500');
    wrapper.unmount();
  });
});

describe('loading indication', () => {
  it('shows progress while a request is in flight', async () => {
    const wrapper = mountHome();
    // Captured out of the executor, which TypeScript cannot see always runs
    // synchronously -- hence the definite-assignment annotation rather than a
    // guard at the call site below.
    let resolve!: (response: AxiosResponse<ApiCity[]>) => void;
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    const inFlight = store.getCities();
    await wrapper.vm.$nextTick();
    expect(store.isLoading).toBe(true);

    resolve(axiosResponse([], 200));
    await inFlight;
    await wrapper.vm.$nextTick();

    expect(store.isLoading).toBe(false);
    wrapper.unmount();
  });
});
