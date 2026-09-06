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
import type { SelectFilterInput } from '@/types/domain';

const { aqra } = await import('@/services/api');
const { useFiltersStore } = await import('../filters');
const { useCitiesStore } = await import('../cities');

const ok = <T,>(data: unknown) => Promise.resolve(axiosResponse<T>(data, 200));

let filters: ReturnType<typeof useFiltersStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  filters = useFiltersStore();
  vi.clearAllMocks();
});

// The behaviour of setValue, the option setters and the two page initialisers
// is covered by the existing describes in airPollution.spec.ts, which drive
// them through the facade with their assertions unedited. This file covers the
// structure those tests cannot see.

describe('separation from the entity cache', () => {
  it('holds the eight filter inputs and nothing else', () => {
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

  // The dependency runs one way and it matters which. This store reads the
  // cities store to build its city options and calls its fetchers; the cities
  // store takes a city name as an argument and never reaches for a select.
  // Asserted through behaviour rather than by inspecting imports: setValue's
  // 'sensor' arm is the only place the two meet.
  it('supplies the selected city to the cache, which does not read it', async () => {
    vi.mocked(aqra.getDataForAllAvailablePollutantsBySensorId).mockReturnValue(
      ok([])
    );
    vi.mocked(aqra.getDataForHistoricalPollution).mockReturnValue(
      ok({ latitude: 1, longitude: 2, data: [] })
    );
    filters.nameInput = { value: 'ohrid' } as SelectFilterInput;
    filters.pollutantInput = {} as SelectFilterInput;

    await filters.setValue({
      input: { id: 'sensor' } as SelectFilterInput,
      value: 'sensor-3',
    });

    expect(
      aqra.getDataForAllAvailablePollutantsBySensorId
    ).toHaveBeenCalledWith('ohrid', 'sensor-3');
    expect(aqra.getDataForHistoricalPollution).toHaveBeenCalledWith(
      'ohrid',
      'sensor-3'
    );
  });

  it('builds the city options from the cities store', async () => {
    vi.mocked(aqra.getDataForAllCities).mockReturnValue(
      ok([
        {
          cityName: 'skopje',
          siteName: 'Skopje',
          cityLocation: { latitude: '41.99', longitute: '21.42' },
          cityBorderPoints: [],
        },
      ])
    );
    await useCitiesStore().getCities();

    filters.initStatisticPage();

    expect(filters.nameInput.items).toEqual([
      { label: 'Skopje', value: 'skopje' },
    ]);
  });
});
