import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { axiosResponse } from '@/__tests__/support/expect';
import type { ApiCity } from '@/types/api';

const { aqra } = await import('@/services/api');
const { useCitiesStore } = await import('../cities');
const { useAirPollutionStore } = await import('../airPollution');
const { useFiltersStore } = await import('../filters');

const ok = <T,>(data: unknown) => Promise.resolve(axiosResponse<T>(data, 200));

const API_CITY: ApiCity = {
  cityName: 'skopje',
  siteName: 'Skopje',
  cityLocation: { latitude: '41.99', longitute: '21.42' },
  cityBorderPoints: [],
};

let cities: ReturnType<typeof useCitiesStore>;
let filters: ReturnType<typeof useFiltersStore>;
let facade: ReturnType<typeof useAirPollutionStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  cities = useCitiesStore();
  filters = useFiltersStore();
  facade = useAirPollutionStore();
  vi.clearAllMocks();
});

// The 40 fetch and cache tests for this store's behaviour did not move here.
// They stayed in airPollution.spec.ts, driving these actions through the
// facade, unchanged -- which is the strongest evidence available that the
// extraction preserved behaviour, since not one expectation had to be edited.
//
// What is here is what those tests cannot see: that the split happened at all.

describe('separation from the filter store', () => {
  it('holds the entity graph and the request plumbing, and no filter inputs', () => {
    expect(Object.keys(cities.$state).sort()).toEqual([
      'cities',
      'error',
      'forecastBySensorId',
      'historyData',
      'pending',
      'pollutantsBySensorId',
    ]);
  });

  it('leaves every filter input on the filters store', () => {
    expect(Object.keys(filters.$state).sort()).toEqual([
      'nameInput',
      'pollutantInput',
      'sensorInput',
      'showCityBoundariesInput',
      'showCityMarkersInput',
      'showForAllCitiesInput',
      'showForAllSensorsInput',
      'showSensorMarkersInput',
    ]);
  });

  // The facade owns no state at all -- every field on it is a getter onto
  // cities, filters or ui. Asserted, because a field quietly added back here
  // would be a fourth copy of something that already has an owner.
  it('leaves the facade holding no state of its own', () => {
    expect(Object.keys(facade.$state)).toEqual([]);
  });

  // The city name used to be read off nameInput.value inside these two
  // fetchers, which was the single line coupling the entity cache to the
  // filter selects. It is a parameter now, and the caller supplies it.
  it('takes the city name as a parameter rather than reading a select', async () => {
    vi.mocked(aqra.getDataForHistoricalPollution).mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );

    await cities.getHistoryDataBySensorId('ohrid', 'sensor-9');

    expect(aqra.getDataForHistoricalPollution).toHaveBeenCalledWith(
      'ohrid',
      'sensor-9'
    );
  });
});

// Each delegation is driven once. Without these the facade's passthroughs are
// dead lines that would keep compiling after the store beneath them changed
// shape -- and a facade nobody exercises is exactly how two copies of a surface
// start to drift.
describe('facade fidelity', () => {
  it('reads the entity maps off the cities store rather than copying them', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));

    await cities.getCities();

    // Same object, not an equal one: a copy would satisfy toEqual and would be
    // a second source of truth the moment either side was written to.
    expect(facade.cities).toBe(cities.cities);
    expect(facade.historyData).toBe(cities.historyData);
    expect(facade.forecastBySensorId).toBe(cities.forecastBySensorId);
    expect(facade.pollutantsBySensorId).toBe(cities.pollutantsBySensorId);
  });

  it('reports the request state of the cities store', async () => {
    expect(facade.pending).toBe(0);
    expect(facade.isLoading).toBe(false);
    expect(facade.hasError).toBe(false);

    await facade.request(() => Promise.reject(new Error('Network Error')));

    expect(facade.error).toBe('Network Error');
    expect(cities.error).toBe('Network Error');
    expect(facade.hasError).toBe(true);
    expect(facade.pending).toBe(0);

    facade.clearError();
    expect(cities.error).toBeNull();
  });

  it('forwards the two entity writes the component specs do not reach', () => {
    facade.setPollutantsForSensor({ sensorId: 'sensor-1', pollutants: [] });
    expect(cities.pollutantsBySensorId['sensor-1']).toEqual([]);

    facade.setHistoryData({ sensorId: 'sensor-1', historyData: null });
    expect(cities.historyData['sensor-1']).toBeNull();
  });
});
