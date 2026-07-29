import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

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

const { aqra } = await import('@/services/api');
const { useAirPollutionStore } = await import('../airPollution');
const { TabIds } = await import('@/constants/navigationTabs');

const ok = (data) => Promise.resolve({ status: 200, data });
const notOk = (status) => Promise.resolve({ status, data: null });

const API_CITY = {
  cityName: 'skopje',
  siteName: 'Skopje',
  cityLocation: { latitude: '41.99', longitute: '21.42' },
  cityBorderPoints: [],
};
const API_SENSOR = {
  sensorId: 'sensor-1',
  description: 'Centar',
  position: '41.99,21.42',
};

let store;

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
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));

    const cities = await store.getCities();

    expect(cities).toHaveLength(1);
    expect(store.cities.skopje.siteName).toBe('Skopje');
    expect(store.cities.skopje.position).toEqual(['41.99', '21.42']);
  });

  it('returns an empty array and stores nothing on a non-200', async () => {
    aqra.getDataForAllCities.mockReturnValue(notOk(500));

    expect(await store.getCities()).toEqual([]);
    expect(store.cities).toEqual({});
  });

  // CHARACTERIZATION -- axios rejects on 4xx/5xx rather than resolving, so the
  // `status === 200` check never sees a failure and the rejection escapes the
  // action entirely. There is no try/catch anywhere in src/.
  //
  // Phase 8 gives this a real error path; when it does, replace this with an
  // assertion that the store surfaces a user-visible error instead.
  it('currently lets a rejected request escape unhandled (see Phase 8)', async () => {
    aqra.getDataForAllCities.mockRejectedValue(new Error('Network Error'));

    await expect(store.getCities()).rejects.toThrow('Network Error');
  });
});

describe('getSensorsByCityName', () => {
  beforeEach(async () => {
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));
    await store.getCities();
  });

  it('maps sensors and files them under the city', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));

    const sensors = await store.getSensorsByCityName('skopje');

    expect(sensors).toHaveLength(1);
    expect(store.cities.skopje.sensors['sensor-1'].description).toBe('Centar');
  });

  it('serves a cached result without refetching', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));
    await store.getSensorsByCityName('skopje');

    await store.getSensorsByCityName('skopje');

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(notOk(404));

    expect(await store.getSensorsByCityName('skopje')).toEqual([]);
  });
});

describe('getPollutantsBySensorId', () => {
  it('maps pollutants and caches them by sensor id', async () => {
    store.nameInput = { value: 'skopje' };
    aqra.getDataForAllAvailablePollutantsBySensorId.mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );

    const pollutants = await store.getPollutantsBySensorId('sensor-1');

    expect(pollutants[0].name).toBe('pm10');
    expect(store.pollutantsBySensorId['sensor-1']).toHaveLength(1);
  });

  it('serves a cached result without refetching', async () => {
    store.nameInput = { value: 'skopje' };
    aqra.getDataForAllAvailablePollutantsBySensorId.mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );
    await store.getPollutantsBySensorId('sensor-1');

    await store.getPollutantsBySensorId('sensor-1');

    expect(
      aqra.getDataForAllAvailablePollutantsBySensorId
    ).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    store.nameInput = { value: 'skopje' };
    aqra.getDataForAllAvailablePollutantsBySensorId.mockReturnValue(notOk(500));

    expect(await store.getPollutantsBySensorId('sensor-1')).toEqual([]);
  });
});

describe('getHistoryDataBySensorId', () => {
  it('maps history through Forecast and caches it', async () => {
    store.nameInput = { value: 'skopje' };
    aqra.getDataForHistoricalPollution.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getHistoryDataBySensorId('sensor-1');

    expect(store.historyData['sensor-1'].position).toEqual(['41.99', '21.42']);
  });

  it('returns an empty array on a non-200', async () => {
    store.nameInput = { value: 'skopje' };
    aqra.getDataForHistoricalPollution.mockReturnValue(notOk(503));

    expect(await store.getHistoryDataBySensorId('sensor-1')).toEqual([]);
  });
});

describe('getForecastBySensorId', () => {
  beforeEach(async () => {
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));
    await store.getCities();
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));
    await store.getSensorsByCityName('skopje');
  });

  it('attaches the forecast to the sensor', async () => {
    aqra.getForecastForSpecificSensor.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastBySensorId({
      sensorId: 'sensor-1',
      cityName: 'skopje',
    });

    expect(
      store.cities.skopje.sensors['sensor-1'].forecast.position
    ).toEqual(['41.99', '21.42']);
  });

  it('serves a cached forecast without refetching', async () => {
    aqra.getForecastForSpecificSensor.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );
    const args = { sensorId: 'sensor-1', cityName: 'skopje' };
    await store.getForecastBySensorId(args);

    await store.getForecastBySensorId(args);

    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array on a non-200', async () => {
    aqra.getForecastForSpecificSensor.mockReturnValue(notOk(502));

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
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));
    await store.getCities();
  });

  it('attaches the forecast to the city', async () => {
    aqra.getForecastBySpecificCoordinates.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastByCoordinatesForCity({
      position: ['41.99', '21.42'],
      cityName: 'skopje',
    });

    expect(store.cities.skopje.forecast.position).toEqual(['41.99', '21.42']);
    expect(aqra.getForecastBySpecificCoordinates).toHaveBeenCalledWith(
      '41.99',
      '21.42'
    );
  });

  it('returns an empty array on a non-200', async () => {
    aqra.getForecastBySpecificCoordinates.mockReturnValue(notOk(500));

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
    aqra.getDataForAllCities.mockReturnValue(
      ok([API_CITY, { ...API_CITY, cityName: 'bitola', siteName: 'Bitola' }])
    );
    await store.getCities();
  });

  it('getSensorsForAllCities fetches once per city', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));

    await store.getSensorsForAllCities();

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledTimes(2);
  });

  it('getForecastForAllCities fetches once per city', async () => {
    aqra.getForecastBySpecificCoordinates.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastForAllCities();

    expect(aqra.getForecastBySpecificCoordinates).toHaveBeenCalledTimes(2);
  });

  it('getForecastForAllSensors fans out over every city x sensor', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));
    aqra.getForecastForSpecificSensor.mockReturnValue(
      ok({ latitude: 41.99, longitude: 21.42, data: [] })
    );

    await store.getForecastForAllSensors();

    // 2 cities x 1 sensor each.
    expect(aqra.getForecastForSpecificSensor).toHaveBeenCalledTimes(2);
  });

  // CHARACTERIZATION -- these Promise.all fan-outs have no concurrency limit,
  // so a large city list fires every request at once. Phase 8 bounds them;
  // this records that today there is no bound.
  it('currently issues every request concurrently, unbounded (see Phase 8)', async () => {
    let inFlight = 0;
    let peak = 0;
    aqra.getForecastBySpecificCoordinates.mockImplementation(async () => {
      peak = Math.max(peak, ++inFlight);
      await Promise.resolve();
      inFlight--;
      return { status: 200, data: { latitude: 1, longitude: 2, data: [] } };
    });

    await store.getForecastForAllCities();

    expect(peak).toBe(2);
  });
});

describe('page initialisation', () => {
  beforeEach(async () => {
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));
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
    aqra.getDataForAllCities.mockClear();
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
      { description: 'Centar', sensorId: 'sensor-1' },
    ]);

    expect(store.sensorInput.items).toEqual([
      { label: 'Centar', value: 'sensor-1' },
    ]);
    expect(store.sensorInput.value).toBeNull();
    expect(store.pollutantInput.value).toBeNull();
  });

  it('setSensorInputOptions tolerates a null option list', () => {
    store.setSensorInputOptions(null);

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
    aqra.getDataForAllCities.mockReturnValue(ok([API_CITY]));
    await store.getCities();
    store.initMapPage();
  });

  it('writes the value onto the input it was given', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));

    await store.setValue({ input: store.nameInput, value: 'skopje' });

    expect(store.nameInput.value).toBe('skopje');
  });

  it('selecting a city loads that city’s sensors into the sensor select', async () => {
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));

    await store.setValue({ input: store.nameInput, value: 'skopje' });

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledWith('skopje');
    expect(store.sensorInput.items).toEqual([
      { label: 'Centar', value: 'sensor-1' },
    ]);
  });

  it('selecting a sensor loads its pollutants and history', async () => {
    store.nameInput.value = 'skopje';
    aqra.getDataForAllAvailablePollutantsBySensorId.mockReturnValue(
      ok([{ name: 'pm10', value: 42 }])
    );
    aqra.getDataForHistoricalPollution.mockReturnValue(
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
    aqra.getForecastForSpecificSensor.mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));
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
    aqra.getAvailableSensorsForCity.mockReturnValue(ok([API_SENSOR]));

    await store.setValue({
      input: store.showSensorMarkersInput,
      value: true,
    });

    expect(aqra.getAvailableSensorsForCity).toHaveBeenCalledWith('skopje');
  });

  it('ignores an input id with no branch, without throwing', async () => {
    await expect(
      store.setValue({ input: { id: 'showCityBoundaries' }, value: true })
    ).resolves.toBeUndefined();
  });
});
