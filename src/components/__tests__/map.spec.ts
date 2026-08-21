// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { present } from '@/__tests__/support/expect';
import type { City } from '@/classes/city';
import { Forecast } from '@/classes/forecast';
import { aqra } from '@/services/api';

// Leaflet needs real layout, so both it and the map helpers are mocked; these
// tests assert the component's orchestration, not Leaflet's rendering.
const mapInstance = {
  setView: vi.fn().mockReturnThis(),
  fitBounds: vi.fn(),
  remove: vi.fn(),
  removeLayer: vi.fn(),
};

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mapInstance),
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  },
}));

// These tests run the real store actions (stubActions: false) so that the
// component's orchestration is exercised end to end. That means setValue
// reaches the API layer, which must be mocked or jsdom issues real XHRs.
vi.mock('@/services/api', () => ({
  aqra: {
    getDataForAllCities: vi.fn(() => Promise.resolve({ status: 200, data: [] })),
    getAvailableSensorsForCity: vi.fn(() =>
      Promise.resolve({ status: 200, data: [] })
    ),
    getForecastBySpecificCoordinates: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
    getForecastForSpecificSensor: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
    getDataForAllAvailablePollutantsBySensorId: vi.fn(() =>
      Promise.resolve({ status: 200, data: [] })
    ),
    getDataForHistoricalPollution: vi.fn(() =>
      Promise.resolve({ status: 200, data: null })
    ),
  },
}));

// constants/layers.js imports the heat-layer builders, so the mock must supply
// them too or CreateLayer[...] resolves to undefined.
vi.mock('@/utils/createMap', () => ({
  createBaseLayer: vi.fn(),
  createCityBoundaries: vi.fn(() => ['boundary']),
  mapCities: vi.fn(() => ['cityMarker']),
  mapSensorsInCities: vi.fn(() => ['sensorMarker']),
  removeLayer: vi.fn(() => null),
  createHeatLayer: vi.fn(() => ({ heatLayer: 'heat', time: ['10:30'] })),
  createHeatLayers: vi.fn(() => ({ heatLayer: 'heat', time: ['10:30'] })),
  createSensorHeatLayers: vi.fn(() => ({
    heatLayer: 'heat',
    time: ['10:30'],
  })),
}));

const Map = (await import('../map/Map.vue')).default;
const createMap = await import('@/utils/createMap');
const { Layers } = await import('@/constants/layers');
const { useAirPollutionStore } = await import('@/stores/airPollution');
const { stubBrowserApis, globalMountOptions, setViewportWidth } = await import(
  './helpers'
);

const CITY = {
  cityName: 'skopje',
  siteName: 'Skopje',
  position: ['41.99', '21.42'],
  borders: [['41.9', '21.3']],
  forecast: {
    position: ['41.99', '21.42'],
    data: [{ time: '10:30', pm10: 42 }],
  },
  sensors: {
    's1': {
      sensorId: 's1',
      position: ['41.99', '21.42'],
      forecast: {
        position: ['41.99', '21.42'],
        data: [{ time: '10:30', pm10: 42 }],
      },
    },
  },
};

// Cast once, where the fixture is declared, rather than at each use. This
// fixture deliberately carries only the fields Map.vue reads -- the tests
// exercise the component's orchestration, not City's shape, which city.spec
// already covers against the real payload type.
const cities = { skopje: CITY as unknown as City };

const mountIt = () => {
  const wrapper = mount(Map, {
    global: {
      ...globalMountOptions({ stubActions: false }),
      stubs: { Filters: true },
    },
  });

  const store = useAirPollutionStore();
  store.cities = cities;
  return { wrapper, store };
};

beforeEach(() => {
  stubBrowserApis();
  vi.clearAllMocks();
});

describe('Map lifecycle', () => {
  it('creates the Leaflet map and draws the base layer on mount', () => {
    const { wrapper } = mountIt();

    expect(createMap.createBaseLayer).toHaveBeenCalledWith(mapInstance);
    expect(createMap.mapCities).toHaveBeenCalled();
    wrapper.unmount();
  });

  // Regression guard: this hook was beforeDestroy, which Vue 3 never calls.
  // Left unrenamed the Leaflet instance is never torn down and leaks on every
  // tab switch.
  it('removes the Leaflet instance on unmount', () => {
    const { wrapper } = mountIt();

    wrapper.unmount();

    expect(mapInstance.remove).toHaveBeenCalled();
  });

  it('sizes the map container to the viewport below the app bar', () => {
    const { wrapper } = mountIt();

    expect(wrapper.vm.mapStyle.height).toContain('calc(100vh -');
    wrapper.unmount();
  });
});

describe('Map filter handling', () => {
  it('fits the map to the city borders when a city is chosen', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.setName({ input: store.nameInput, value: 'skopje' });

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(CITY.borders);
    wrapper.unmount();
  });

  // Regression guard: setSensorsByCity guarded `!this.cities` but not
  // `this.cities[cityName]`, so any name absent from the loaded map threw
  // while assigning `.sensors` on undefined. Both cases below are ordinary
  // user actions -- clearing the select sends null -- and Map.vue's own
  // `if (!config.value) return` guard never ran, because the store threw first.
  it.each([
    ['cleared (null)', null],
    ['an unknown city', 'atlantis'],
  ])('handles the city being %s without throwing', async (_, value) => {
    const { wrapper, store } = mountIt();

    await expect(
      wrapper.vm.setName({ input: store.nameInput, value })
    ).resolves.toBeUndefined();
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('adds city boundaries when the toggle is switched on', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.changeBoundaries({
      input: store.showCityBoundariesInput,
      value: true,
    });

    expect(createMap.createCityBoundaries).toHaveBeenCalled();
    expect(wrapper.vm.polygons).toEqual(['boundary']);
    wrapper.unmount();
  });

  it('removes city boundaries when the toggle is switched off', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.changeBoundaries({
      input: store.showCityBoundariesInput,
      value: false,
    });

    expect(createMap.removeLayer).toHaveBeenCalled();
    expect(wrapper.vm.polygons).toBeNull();
    wrapper.unmount();
  });

  it('adds and removes sensor markers with the toggle', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.changeSensorMarkers({
      input: store.showSensorMarkersInput,
      value: true,
    });
    expect(wrapper.vm.sensorMarkers).toEqual(['sensorMarker']);

    await wrapper.vm.changeSensorMarkers({
      input: store.showSensorMarkersInput,
      value: false,
    });
    expect(wrapper.vm.sensorMarkers).toBeNull();
    wrapper.unmount();
  });

  it('adds and removes city markers with the toggle', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.changeCityMarkers({
      input: store.showCityMarkersInput,
      value: true,
    });
    expect(wrapper.vm.cityMarkers).toEqual(['cityMarker']);

    await wrapper.vm.changeCityMarkers({
      input: store.showCityMarkersInput,
      value: false,
    });
    expect(wrapper.vm.cityMarkers).toBeNull();
    wrapper.unmount();
  });

  it('clears the heat layers when an "all" toggle changes', async () => {
    const { wrapper, store } = mountIt();

    await wrapper.vm.setShowForAllCities({
      input: store.showForAllCitiesInput,
      value: true,
    });

    expect(createMap.removeLayer).toHaveBeenCalled();
    expect(wrapper.vm.heatLayers).toBeNull();
    wrapper.unmount();
  });
});

describe('Map pollutant selection', () => {
  it('selects the single-sensor layer by default', async () => {
    const { wrapper, store } = mountIt();
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 's1';

    await wrapper.vm.setPollutant({
      input: store.pollutantInput,
      value: 'pm10',
    });

    expect(present(wrapper.vm.selected).selected).toBe(Layers.SelectedSensor);
    wrapper.unmount();
  });

  it('selects the all-cities layer when that toggle is on', async () => {
    const { wrapper, store } = mountIt();
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 's1';
    store.showForAllCitiesInput.value = true;

    await wrapper.vm.setPollutant({
      input: store.pollutantInput,
      value: 'pm10',
    });

    expect(present(wrapper.vm.selected).selected).toBe(Layers.AllCities);
    wrapper.unmount();
  });

  it('selects the all-sensors layer when that toggle is on', async () => {
    const { wrapper, store } = mountIt();
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 's1';
    store.showForAllSensorsInput.value = true;

    await wrapper.vm.setPollutant({
      input: store.pollutantInput,
      value: 'pm10',
    });

    expect(present(wrapper.vm.selected).selected).toBe(Layers.AllSensors);
    wrapper.unmount();
  });

  it('clears the layers and stops when the pollutant is cleared', async () => {
    const { wrapper, store } = mountIt();
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 's1';

    await wrapper.vm.setPollutant({
      input: store.pollutantInput,
      value: null,
    });

    expect(wrapper.vm.selected).toBeNull();
    wrapper.unmount();
  });

  // Regression guard: setForecastForSensor guarded `.sensors` but not
  // `this.cities[cityName]`, so picking a pollutant before a city
  // dereferenced cities[null] and threw. Reachable in the real UI -- setValue
  // only skips the single-sensor fetch when an "all" toggle is on.
  it('handles a pollutant picked with no city selected', async () => {
    const { wrapper, store } = mountIt();
    const cityKeysBefore = Object.keys(store.cities ?? {});

    // A real payload, so the assertion below is about Forecast.fromApi rather
    // than about the default mock returning null.
    vi.mocked(aqra.getForecastForSpecificSensor).mockResolvedValueOnce({
      status: 200,
      data: { latitude: 41.99, longitude: 21.43, data: [] },
    } as never);

    const forecast = await store.getForecastBySensorId({
      sensorId: null,
      cityName: null,
    });

    // Not merely "it resolved": the nulls reach the request, a Forecast comes
    // back, and setForecastForSensor writes nothing because it has no sensor
    // to write to -- which is the dereference that used to throw. The previous
    // assertion here was `resolves.toBeDefined()`, which null satisfies, so it
    // could not tell a forecast from no forecast at all.
    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledWith(null, null);
    expect(forecast).toBeInstanceOf(Forecast);
    // mapPosition stringifies, which is what Leaflet is handed.
    expect((forecast as Forecast).position).toEqual(['41.99', '21.43']);
    expect(Object.keys(store.cities ?? {})).toEqual(cityKeysBefore);
    wrapper.unmount();
  });

  it('redraws the heat layer when the time slider moves', async () => {
    const { wrapper, store } = mountIt();
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 's1';
    store.showForAllCitiesInput.value = true;
    await wrapper.vm.setPollutant({
      input: store.pollutantInput,
      value: 'pm10',
    });
    vi.mocked(createMap.removeLayer).mockClear();

    wrapper.vm.sliderChange(5);

    expect(createMap.removeLayer).toHaveBeenCalled();
    expect(wrapper.vm.heatLayers).toHaveLength(1);
    wrapper.unmount();
  });
});

/**
 * Map renders <Filters> twice -- once for desktop, once for mobile -- and picks
 * between them by viewport. It used to pick with Vuetify 2's `hidden-*` classes,
 * which Vuetify 3 removed, so BOTH rendered at every width: two "Pollutants"
 * selects and ten checkboxes stacked on top of each other. Exactly one must
 * render at either end of the breakpoint.
 */
describe('responsive filter layout', () => {
  it('renders exactly one Filters block on desktop', async () => {
    const { wrapper } = mountIt();

    setViewportWidth(1280);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('filters-stub')).toHaveLength(1);
    wrapper.unmount();
  });

  it('renders exactly one Filters block on mobile', async () => {
    const { wrapper } = mountIt();

    setViewportWidth(500);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('filters-stub')).toHaveLength(1);
    wrapper.unmount();
  });
});
