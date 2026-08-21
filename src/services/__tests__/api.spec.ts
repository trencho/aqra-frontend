import { beforeEach, describe, expect, it, vi } from 'vitest';

import { at } from '@/__tests__/support/expect';

// Mock the axios module before importing api.js, so `aqra`'s functions close
// over the mock rather than the real (globally-mutated) axios singleton.
vi.mock('../axios', () => ({
  axios: { get: vi.fn(() => Promise.resolve({ status: 200, data: {} })) },
}));

const { axios } = await import('../axios');
const { aqra } = await import('../api');

// vi.mocked re-types the real axios.get signature as the mock it actually is at
// runtime, which is what makes `.mock` and `.mockClear` reachable. Casting to
// `any` would work too and would stop checking the call arguments.
const get = vi.mocked(axios.get);

/** The URL the single axios.get call was made with. */
const calledUrl = () => at(get.mock.calls, get.mock.calls.length - 1)[0];

beforeEach(() => {
  get.mockClear();
});

describe('aqra API — URL construction', () => {
  it('exposes exactly the 6 documented endpoints', () => {
    expect(Object.keys(aqra).sort()).toEqual(
      [
        'getAvailableSensorsForCity',
        'getDataForAllAvailablePollutantsBySensorId',
        'getDataForAllCities',
        'getDataForHistoricalPollution',
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

  });

  describe('pollutants', () => {
    it('getDataForAllAvailablePollutantsBySensorId', async () => {
      await aqra.getDataForAllAvailablePollutantsBySensorId(
        'skopje',
        'sensor-1'
      );
      expect(calledUrl()).toBe('/cities/skopje/sensors/sensor-1/pollutants/');
    });

  });

  it('every endpoint path is absolute and trailing-slashed', async () => {
    // The API 301-redirects a path without its trailing slash, which silently
    // drops the Authorization header on some clients. Keep them all uniform.
    const calls = [
      () => aqra.getDataForAllCities(),
      () => aqra.getForecastBySpecificCoordinates(1, 2),
      () => aqra.getForecastForSpecificSensor('c', 's'),
      () => aqra.getAvailableSensorsForCity('c'),
      () => aqra.getDataForHistoricalPollution('c', 's'),
      () => aqra.getDataForAllAvailablePollutantsBySensorId('c', 's'),
    ];

    for (const call of calls) {
      await call();
      expect(calledUrl()).toMatch(/^\/.*\/$/);
    }

    expect(axios.get).toHaveBeenCalledTimes(6);
  });
});
