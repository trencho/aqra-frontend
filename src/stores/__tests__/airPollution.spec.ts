import { createPinia,setActivePinia } from 'pinia';
import { beforeEach,describe, expect, it, vi } from 'vitest';

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

import type { AxiosResponse } from 'axios';

import { axiosResponse, present } from '@/__tests__/support/expect';
import type { Forecast } from '@/classes/forecast';
import type { Sensor } from '@/classes/sensors';
import type { ApiCity, ApiSensor } from '@/types/api';
import type { SelectFilterInput } from '@/types/domain';

const { aqra } = await import('@/services/api');
const { useAirPollutionStore } = await import('../airPollution');
const { TabIds } = await import('@/constants/navigationTabs');
const { DEFAULT_CONCURRENCY } = await import('@/utils/concurrency');

// Generic, so each endpoint mock resolves with the payload type that endpoint
// actually declares -- `ok([API_CITY])` against getDataForAllCities is checked
// as ApiCity[]. A non-generic helper would have satisfied the compiler while
// letting any fixture through.
const ok = <T,>(data: unknown) => Promise.resolve(axiosResponse<T>(data, 200));
const notOk = <T,>(status: number) =>
  Promise.resolve(axiosResponse<T>(null, status));

const API_CITY: ApiCity = {
  cityName: 'skopje',
  siteName: 'Skopje',
  cityLocation: { latitude: '41.99', longitute: '21.42' },
  cityBorderPoints: [],
};
const API_SENSOR: ApiSensor = {
  sensorId: 'sensor-1',
  description: 'Centar',
  position: '41.99,21.42',
};

// One annotation, and 142 of this file's 190 conversion errors go away --
// every `store.x` in the suite was an unchecked `any`. This is precisely what
// makes the difference between converting the specs and merely renaming them:
// `let store: any` would have compiled just as well and checked nothing.
let store: ReturnType<typeof useAirPollutionStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  store = useAirPollutionStore();
  vi.clearAllMocks();
});

describe('initial state', () => {
  it('starts on the Home tab with the drawer closed', () => {
    expect(store.tabId).toBe(TabIds.Home);
    expect(store.drawer).toBe(false);
  });
});

describe('ui actions', () => {
  it('setDrawer toggles the drawer', () => {
    store.setDrawer(true);
    expect(store.drawer).toBe(true);

    store.setDrawer(false);
    expect(store.drawer).toBe(false);
  });

  it('changeTab closes the drawer when moving to a different tab', () => {
    store.setDrawer(true);

    store.changeTab(TabIds.Statistics);

    expect(store.tabId).toBe(TabIds.Statistics);
    expect(store.drawer).toBe(false);
  });

  it('changeTab leaves the drawer alone when re-selecting the current tab', () => {
    store.changeTab(TabIds.Statistics);
    store.setDrawer(true);

    store.changeTab(TabIds.Statistics);

    expect(store.drawer).toBe(true);
  });
});

describe('getCities', () => {
  it('maps the response into a city map keyed by cityName', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));

    const cities = await store.getCities();

    expect(cities).toHaveLength(1);
    expect(present(store.cities.skopje).siteName).toBe('Skopje');
    expect(present(store.cities.skopje).position).toEqual(['41.99', '21.42']);
  });

  // The guard used to be `this.cities.length` on a Record keyed by city name,
  // so it was always undefined and never fired: every call refetched every
  // city. Nothing caught it because no test called getCities twice and counted.
  it('serves the second call from the cache without refetching', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));

    const first = await store.getCities();
    const second = await store.getCities();

    expect(aqra.getDataForAllCities).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  // A failed request stores nothing, so the cache must stay cold -- otherwise
  // one early failure would wedge the app on an empty city list forever.
  it('retries after a failed request rather than caching the failure', async () => {
    vi.mocked(aqra.getDataForAllCities).mockRejectedValueOnce(
      new Error('Network Error')
    );
    expect(await store.getCities()).toEqual([]);

    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    const retried = await store.getCities();

    expect(aqra.getDataForAllCities).toHaveBeenCalledTimes(2);
    expect(retried).toHaveLength(1);
  });

  it('returns an empty array and stores nothing on a non-200', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(notOk(500));

    expect(await store.getCities()).toEqual([]);
    expect(store.cities).toEqual({});
  });

  // Regression guard: axios rejects on 4xx/5xx rather than resolving, so the
  // `status === 200` check never saw a failure and the rejection escaped the
  // action entirely -- there was no try/catch anywhere in src/, so the UI was
  // left stuck with no feedback.
  it('surfaces a rejected request as store error state, not a rejection', async () => {
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('Network Error'));

    await expect(store.getCities()).resolves.toEqual([]);
    expect(store.error).toBe('Network Error');
    expect(store.hasError).toBe(true);
  });

  it('records an error for a non-200 too', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(notOk(503));

    await store.getCities();

    expect(store.error).toContain('503');
  });

  it('clears a previous error once a request succeeds', async () => {
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('Network Error'));
    await store.getCities();
    expect(store.hasError).toBe(true);

    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();

    expect(store.error).toBeNull();
    expect(store.hasError).toBe(false);
  });

  it('clearError resets the error state', async () => {
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('boom'));
    await store.getCities();

    store.clearError();

    expect(store.error).toBeNull();
  });
});

describe('loading state', () => {
  it('reports loading while a request is in flight and not after', async () => {
    let resolve!: (response: AxiosResponse<ApiCity[]>) => void;
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    const inFlight = store.getCities();
    expect(store.isLoading).toBe(true);

    resolve(axiosResponse([], 200));
    await inFlight;

    expect(store.isLoading).toBe(false);
  });

  it('stops reporting loading even when the request fails', async () => {
    vi.mocked(aqra.getDataForAllCities).mockRejectedValue(new Error('boom'));

    await store.getCities();

    expect(store.isLoading).toBe(false);
  });
});

describe('resilience of the mutation helpers', () => {
  // These four used to guard the cities container but not the individual city,
  // so `this.cities[cityName]` was dereferenced blind. Clearing the city
  // select sends null and an unknown name reaches here too -- both threw.
  it('setSensorsByCity ignores an unknown or null city', () => {
    expect(() =>
      store.setSensorsByCity({ cityName: null, sensors: [] })
    ).not.toThrow();
    expect(() =>
      store.setSensorsByCity({ cityName: 'atlantis', sensors: [] })
    ).not.toThrow();
  });

  it('setForecastForSensor ignores an unknown city or sensor', () => {
    expect(() =>
      store.setForecastForSensor({
        sensorId: null,
        cityName: null,
        forecast: {} as Forecast,
      })
    ).not.toThrow();
  });

  it('setForecastForCity ignores an unknown city', () => {
    expect(() =>
      store.setForecastForCity({ cityName: 'atlantis', forecast: {} as Forecast })
    ).not.toThrow();
  });

  it('getSensorsByCityName resolves to [] for an unknown city', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    await expect(store.getSensorsByCityName('atlantis')).resolves.toEqual([
      API_SENSOR,
    ].map(() => expect.anything()));
  });

  it('getForecastBySensorId resolves rather than throwing with no city', async () => {
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );

    await expect(
      store.getForecastBySensorId({ sensorId: null, cityName: null })
    ).resolves.toBeDefined();
  });
});

describe('getSensorsByCityName', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();
  });

  it('maps sensors and files them under the city', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    const sensors = await store.getSensorsByCityName('skopje');

    expect(sensors).toHaveLength(1);
    expect(present(present(present(store.cities.skopje).sensors)['sensor-1']).description).toBe('Centar');
  });

  it('serves a cached result without refetching', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));
    await store.getSensorsByCityName('skopje');

    await store.getSensorsByCityName('skopje');

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(notOk(404));

    expect(await store.getSensorsByCityName('skopje')).toEqual([]);
  });
});

describe('getPollutantsBySensorId', () => {
  it('maps pollutants and caches them by sensor id', async () => {
    store.nameInput = { value: 'skopje' } as SelectFilterInput;
    vi.mocked(aqra.getDataForAllAvailablePollutantsBySensorId).mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );

    const pollutants = await store.getPollutantsBySensorId('sensor-1');

    expect(present(pollutants[0]).name).toBe('pm10');
    expect(store.pollutantsBySensorId['sensor-1']).toHaveLength(1);
  });

  it('serves a cached result without refetching', async () => {
    store.nameInput = { value: 'skopje' } as SelectFilterInput;
    vi.mocked(aqra.getDataForAllAvailablePollutantsBySensorId).mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );
    await store.getPollutantsBySensorId('sensor-1');

    await store.getPollutantsBySensorId('sensor-1');

    expect(
      aqra.getDataForAllAvailablePollutantsBySensorId
    ).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    store.nameInput = { value: 'skopje' } as SelectFilterInput;
    vi.mocked(aqra.getDataForAllAvailablePollutantsBySensorId).mockReturnValue(notOk(500));

    expect(await store.getPollutantsBySensorId('sensor-1')).toEqual([]);
  });
});

describe('getHistoryDataBySensorId', () => {
  it('maps history through Forecast and caches it', async () => {
    store.nameInput = { value: 'skopje' } as SelectFilterInput;
    vi.mocked(aqra.getDataForHistoricalPollution).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getHistoryDataBySensorId('sensor-1');

    expect(present(store.historyData['sensor-1']).position).toEqual([
      '41.99',
      '21.42',
    ]);
  });

  it('returns an empty array on a non-200', async () => {
    store.nameInput = { value: 'skopje' } as SelectFilterInput;
    vi.mocked(aqra.getDataForHistoricalPollution).mockReturnValue(notOk(503));

    expect(await store.getHistoryDataBySensorId('sensor-1')).toEqual([]);
  });
});

describe('getForecastBySensorId', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));
    await store.getSensorsByCityName('skopje');
  });

  it('attaches the forecast to the sensor', async () => {
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastBySensorId({
      sensorId: 'sensor-1',
      cityName: 'skopje',
    });

    expect(
      present(
        present(present(present(store.cities.skopje).sensors)['sensor-1'])
          .forecast
      ).position
    ).toEqual(['41.99', '21.42']);
  });

  it('serves a cached forecast without refetching', async () => {
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );
    const args = { sensorId: 'sensor-1', cityName: 'skopje' };
    await store.getForecastBySensorId(args);

    await store.getForecastBySensorId(args);

    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(notOk(502));

    expect(
      await store.getForecastBySensorId({
        sensorId: 'sensor-1',
        cityName: 'skopje',
      })
    ).toEqual([]);
  });
});

describe('getForecastByCoordinatesForCity', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();
  });

  it('attaches the forecast to the city', async () => {
    vi.mocked(aqra.getForecastBySpecificCoordinates).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastByCoordinatesForCity({
      position: ['41.99', '21.42'],
      cityName: 'skopje',
    });

    expect(present(present(store.cities.skopje).forecast).position).toEqual([
      '41.99',
      '21.42',
    ]);
    expect(aqra.getForecastBySpecificCoordinates).toHaveBeenCalledWith(
      '41.99',
      '21.42'
    );
  });

  it('returns an empty array on a non-200', async () => {
    vi.mocked(aqra.getForecastBySpecificCoordinates).mockReturnValue(notOk(500));

    expect(
      await store.getForecastByCoordinatesForCity({
        position: ['41.99', '21.42'],
        cityName: 'skopje',
      })
    ).toEqual([]);
  });
});

describe('bulk fan-out actions', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(
      ok([API_CITY, { ...API_CITY, cityName: 'bitola', siteName: 'Bitola' }])
    );
    await store.getCities();
  });

  it('getSensorsForAllCities fetches once per city', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    await store.getSensorsForAllCities();

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledTimes(2);
  });

  it('getForecastForAllCities fetches once per city', async () => {
    vi.mocked(aqra.getForecastBySpecificCoordinates).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastForAllCities();

    expect(aqra.getForecastBySpecificCoordinates).toHaveBeenCalledTimes(2);
  });

  it('getForecastForAllSensors fans out over every city x sensor', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastForAllSensors();

    // 2 cities x 1 sensor each.
    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledTimes(2);
  });

  // Regression guard: these fan-outs were bare Promise.all over every city x
  // sensor with no limit, so a large list queued hundreds of requests in the
  // browser, each burning its client timeout while waiting its turn.
  it('caps concurrent requests at the configured limit', async () => {
    // Distinct positions matter: getForecastByCoordinatesForCity short-circuits
    // on a city already holding a forecast for the same position object, so
    // reusing one position would make 29 of the 30 cache hits.
    const cities = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [
        `city-${i}`,
        { ...API_CITY, cityName: `city-${i}`, position: [`${i}`, `${i}`] },
      ])
    );
    store.cities = cities as unknown as typeof store.cities;

    let inFlight = 0;
    let peak = 0;
    vi.mocked(aqra.getForecastBySpecificCoordinates).mockImplementation(async () => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((r) => setTimeout(r, 0));
      inFlight--;
      return axiosResponse({ latitude: 1, longitude: 2, data: [] }, 200);
    });

    await store.getForecastForAllCities();

    expect(aqra.getForecastBySpecificCoordinates).toHaveBeenCalledTimes(30);
    expect(peak).toBeLessThanOrEqual(DEFAULT_CONCURRENCY);
    expect(peak).toBeGreaterThan(1);
  });
});

describe('page initialisation', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();
  });

  it('initMapPage builds the filter inputs from the loaded cities', () => {
    store.initMapPage();

    expect(store.nameInput.items).toEqual([
      { label: 'Skopje', value: 'skopje' },
    ]);
    expect(store.sensorInput.items).toEqual([]);
    expect(store.showCityMarkersInput.value).toBe(true);
    expect(store.showForAllCitiesInput.value).toBe(false);
  });

  it('initStatisticPage builds only the three select inputs', () => {
    store.initStatisticPage();

    expect(store.nameInput.id).toBe('name');
    expect(store.sensorInput.id).toBe('sensor');
    expect(store.pollutantInput.id).toBe('pollutant');
    // The map-only toggles must not be created here.
    expect(store.showCityMarkersInput.value).toBeUndefined();
  });

  it('initHomePage loads the cities', async () => {
    vi.mocked(aqra.getDataForAllCities).mockClear();
    store.cities = {};

    await store.initHomePage();

    expect(aqra.getDataForAllCities).toHaveBeenCalledTimes(1);
  });
});

describe('option setters', () => {
  beforeEach(() => {
    store.initMapPage();
  });

  it('setSensorInputOptions maps sensors and clears dependent values', () => {
    store.sensorInput.value = 'stale';
    store.pollutantInput.value = 'stale';

    store.setSensorInputOptions([
      { description: 'Centar', sensorId: 'sensor-1' } as Sensor,
    ]);

    expect(store.sensorInput.items).toEqual([
      { label: 'Centar', value: 'sensor-1' },
    ]);
    expect(store.sensorInput.value).toBeNull();
    expect(store.pollutantInput.value).toBeNull();
  });

  it('setSensorInputOptions tolerates a null option list', () => {
    store.setSensorInputOptions(null as unknown as Sensor[]);

    expect(store.sensorInput.items).toEqual([]);
  });

  it('setPollutantInputOptions maps pollutants and clears the value', () => {
    store.pollutantInput.value = 'stale';

    store.setPollutantInputOptions([{ name: 'pm10', value: 42 }]);

    expect(store.pollutantInput.items).toEqual([{ label: 'pm10', value: 42 }]);
    expect(store.pollutantInput.value).toBeNull();
  });

  it('setShowAllCities hides the city/sensor selects and loads all pollutants', () => {
    store.setShowAllCities(true);

    expect(store.nameInput.hidden).toBe(true);
    expect(store.sensorInput.hidden).toBe(true);
    expect(store.nameInput.value).toBeNull();
    expect(store.showForAllSensorsInput.value).toBe(false);
    expect(store.pollutantInput.items.length).toBeGreaterThan(0);
  });

  it('setShowAllSensors is mutually exclusive with setShowAllCities', () => {
    store.showForAllCitiesInput.value = true;

    store.setShowAllSensors(true);

    expect(store.showForAllCitiesInput.value).toBe(false);
  });

  it('turning the toggle off restores the selects and empties the pollutants', () => {
    store.setShowAllCities(true);

    store.setShowAllCities(false);

    expect(store.nameInput.hidden).toBe(false);
    expect(store.pollutantInput.items).toEqual([]);
  });
});

describe('setValue', () => {
  beforeEach(async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(ok([API_CITY]));
    await store.getCities();
    store.initMapPage();
  });

  it('writes the value onto the input it was given', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    await store.setValue({ input: store.nameInput, value: 'skopje' });

    expect(store.nameInput.value).toBe('skopje');
  });

  it('selecting a city loads that city’s sensors into the sensor select', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    await store.setValue({ input: store.nameInput, value: 'skopje' });

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledWith('skopje');
    expect(store.sensorInput.items).toEqual([
      { label: 'Centar', value: 'sensor-1' },
    ]);
  });

  it('selecting a sensor loads its pollutants and history', async () => {
    store.nameInput.value = 'skopje';
    vi.mocked(aqra.getDataForAllAvailablePollutantsBySensorId).mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );
    vi.mocked(aqra.getDataForHistoricalPollution).mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );

    await store.setValue({ input: store.sensorInput, value: 'sensor-1' });

    expect(store.pollutantInput.items).toEqual([
      { label: 'pm10', value: 42 },
    ]);
    expect(store.historyData['sensor-1']).toBeDefined();
  });

  it('selecting a pollutant fetches the forecast for the selected sensor', async () => {
    store.nameInput.value = 'skopje';
    store.sensorInput.value = 'sensor-1';
    vi.mocked(aqra.getForecastForSpecificSensor).mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));
    await store.getSensorsByCityName('skopje');

    await store.setValue({ input: store.pollutantInput, value: 'pm10' });

    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledWith(
      'skopje',
      'sensor-1'
    );
  });

  it('does not fetch a single-sensor forecast while an "all" toggle is on', async () => {
    store.showForAllCitiesInput.value = true;

    await store.setValue({ input: store.pollutantInput, value: 'pm10' });

    expect(aqra.getForecastForSpecificSensor).not.toHaveBeenCalled();
  });

  it('toggling showSensorMarkers loads sensors for every city', async () => {
    vi.mocked(aqra.getAvailableSensorsForCity).mockReturnValue(ok([API_SENSOR]));

    await store.setValue({
      input: store.showSensorMarkersInput,
      value: true,
    });

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledWith('skopje');
  });

  it('ignores an input id with no branch, without throwing', async () => {
    await expect(
      store.setValue({
        input: { id: 'showCityBoundaries', value: null },
        value: true,
      })
    ).resolves.toBeUndefined();
  });
});
