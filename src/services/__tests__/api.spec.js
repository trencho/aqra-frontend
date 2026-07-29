import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios module before importing api.js, so `aqra`'s functions close
// over the mock rather than the real (globally-mutated) axios singleton.
vi.mock('../axios', () => ({
  axios: { get: vi.fn(() => Promise.resolve({ status: 200, data: {} })) },
}));

const { axios } = await import('../axios');
const { aqra } = await import('../api');

/** The URL the single axios.get call was made with. */
const calledUrl = () => axios.get.mock.calls.at(-1)[0];

beforeEach(() => {
  axios.get.mockClear();
});

describe('aqra API — URL construction', () => {
  it('exposes exactly the 12 documented endpoints', () => {
    expect(Object.keys(aqra).sort()).toEqual(
      [
        'getAvailableSensorsForCity',
        'getDataForAllAvailablePollutantsByCoordinates',
        'getDataForAllAvailablePollutantsBySensorId',
        'getDataForAllCities',
        'getDataForAllCountries',
        'getDataForCity',
        'getDataForCountry',
        'getDataForHistoricalPollution',
        'getDataForSpecificSensorByCityName',
        'getDataForSpecificSensorByCoordinates',
        'getForecastBySpecificCoordinates',
        'getForecastForSpecificSensor',
      ].sort()
    );
  });

  describe('cities', () => {
    it('getDataForAllCities', async () => {
      await aqra.getDataForAllCities();
      expect(calledUrl()).toBe('/cities/');
    });

    it('getDataForCity', async () => {
      await aqra.getDataForCity('skopje');
      expect(calledUrl()).toBe('/cities/skopje/');
    });
  });

  describe('countries', () => {
    it('getDataForAllCountries', async () => {
      await aqra.getDataForAllCountries();
      expect(calledUrl()).toBe('/countries/');
    });

    it('getDataForCountry', async () => {
      await aqra.getDataForCountry('MK');
      expect(calledUrl()).toBe('/countries/MK/');
    });
  });

  describe('forecast', () => {
    it('getForecastBySpecificCoordinates joins coordinates with a comma', async () => {
      await aqra.getForecastBySpecificCoordinates(41.9981, 21.4254);
      expect(calledUrl()).toBe('/cities/coordinates/41.9981,21.4254/forecast/');
    });

    it('getForecastForSpecificSensor', async () => {
      await aqra.getForecastForSpecificSensor('skopje', 'sensor-1');
      expect(calledUrl()).toBe('/cities/skopje/sensors/sensor-1/forecast/');
    });
  });

  describe('sensors', () => {
    it('getAvailableSensorsForCity', async () => {
      await aqra.getAvailableSensorsForCity('skopje');
      expect(calledUrl()).toBe('/cities/skopje/sensors/');
    });

    it('getDataForSpecificSensorByCityName', async () => {
      await aqra.getDataForSpecificSensorByCityName('skopje', 'sensor-1');
      expect(calledUrl()).toBe('/cities/skopje/sensors/sensor-1/');
    });
  });

  describe('history', () => {
    it('getDataForHistoricalPollution defaults dataType to "pollution"', async () => {
      await aqra.getDataForHistoricalPollution('skopje', 'sensor-1');
      expect(calledUrl()).toBe(
        '/cities/skopje/sensors/sensor-1/history/pollution/'
      );
    });

    it('getDataForHistoricalPollution honours an explicit dataType', async () => {
      await aqra.getDataForHistoricalPollution('skopje', 'sensor-1', 'weather');
      expect(calledUrl()).toBe(
        '/cities/skopje/sensors/sensor-1/history/weather/'
      );
    });

    it('getDataForSpecificSensorByCoordinates defaults dataType to "pollution"', async () => {
      await aqra.getDataForSpecificSensorByCoordinates(41.9981, 21.4254);
      expect(calledUrl()).toBe(
        '/coordinates/41.9981,21.4254/history/pollution/'
      );
    });

    it('getDataForSpecificSensorByCoordinates honours an explicit dataType', async () => {
      await aqra.getDataForSpecificSensorByCoordinates(
        41.9981,
        21.4254,
        'weather'
      );
      expect(calledUrl()).toBe('/coordinates/41.9981,21.4254/history/weather/');
    });
  });

  describe('pollutants', () => {
    it('getDataForAllAvailablePollutantsBySensorId', async () => {
      await aqra.getDataForAllAvailablePollutantsBySensorId(
        'skopje',
        'sensor-1'
      );
      expect(calledUrl()).toBe('/cities/skopje/sensors/sensor-1/pollutants/');
    });

    it('getDataForAllAvailablePollutantsByCoordinates', async () => {
      await aqra.getDataForAllAvailablePollutantsByCoordinates(
        41.9981,
        21.4254
      );
      expect(calledUrl()).toBe('/coordinates/41.9981,21.4254/pollutants/');
    });
  });

  it('every endpoint path is absolute and trailing-slashed', async () => {
    // The API 301-redirects a path without its trailing slash, which silently
    // drops the Authorization header on some clients. Keep them all uniform.
    const calls = [
      () => aqra.getDataForAllCities(),
      () => aqra.getDataForCity('skopje'),
      () => aqra.getDataForAllCountries(),
      () => aqra.getDataForCountry('MK'),
      () => aqra.getForecastBySpecificCoordinates(1, 2),
      () => aqra.getForecastForSpecificSensor('c', 's'),
      () => aqra.getAvailableSensorsForCity('c'),
      () => aqra.getDataForSpecificSensorByCityName('c', 's'),
      () => aqra.getDataForHistoricalPollution('c', 's'),
      () => aqra.getDataForSpecificSensorByCoordinates(1, 2),
      () => aqra.getDataForAllAvailablePollutantsBySensorId('c', 's'),
      () => aqra.getDataForAllAvailablePollutantsByCoordinates(1, 2),
    ];

    for (const call of calls) {
      await call();
      expect(calledUrl()).toMatch(/^\/.*\/$/);
    }

    expect(axios.get).toHaveBeenCalledTimes(12);
  });
});
