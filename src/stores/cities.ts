import type { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';

import { City } from '@/classes/city';
import { Forecast } from '@/classes/forecast';
import { Pollutant } from '@/classes/pollutant';
import { Sensor } from '@/classes/sensors';
import type { RequestResult, RequestState } from '@/composables/useRequest';
import {
  createRequestState,
  hasError,
  isLoading,
  useRequest,
} from '@/composables/useRequest';
import { aqra } from '@/services/api';
import type { Position } from '@/types/domain';
import { mapWithConcurrency } from '@/utils/concurrency';

export interface CitiesState extends RequestState {
  /** Every city, keyed by cityName. Sensors and forecasts hang off each City. */
  cities: Record<string, City>;
  /** History series, keyed by sensor id. */
  historyData: Record<string, Forecast | null>;
  /** Sensor forecasts, keyed by sensor id. Written but not currently read. */
  forecastBySensorId: Record<string, Forecast | null>;
  /** Available pollutants, keyed by sensor id. */
  pollutantsBySensorId: Record<string, Array<Pollutant | null>>;
}

/**
 * Index a list by one of its fields.
 *
 * The element type includes null because every fromApi mapper returns null for
 * a missing payload entry. A null entry throws here, exactly as it did before --
 * the API does not send them, and adding a guard would be a behaviour change.
 */
function mapList<T extends object>(
  list: Array<T | null>,
  entity: keyof T
): Record<string, T> {
  const map: Record<string, T> = {};
  list.forEach((i) => (map[i![entity] as string] = i!));
  return map;
}

/**
 * The entity graph and everything that fills it.
 *
 * ## Cache policy, per entity
 *
 * Six fetchers each open with a cache check, and they were six near-copies
 * whose differences read as accidental. They are not all the same, and writing
 * down which is which is the point of this block -- the differences are
 * preserved exactly, because tests pin them.
 *
 * | Fetcher | Hit when | Note |
 * |---|---|---|
 * | `getCities` | `cities` has any key | Collection-level: one populated map means the whole list was fetched. This check used to be `this.cities.length` against a Record, so it was always undefined and every call refetched every city. |
 * | `getSensorsByCityName` | `cities[name].sensors` is set | Nested under its city, so evicting a city evicts its sensors with it. |
 * | `getForecastByCoordinatesForCity` | some city's `position` is reference-equal | **Identity, not value.** Two cities at equal coordinates in different array instances both miss. Preserved deliberately: a test fixture sharing one position array collapses into a hit for the same reason, and changing it would change which requests are made. |
 * | `getForecastBySensorId` | `cities[name].sensors[id].forecast` is set | Two levels deep; a missing city or sensor is a miss, not a throw. |
 * | `getPollutantsBySensorId` | `pollutantsBySensorId[id]` is set | Flat map, keyed by sensor alone. |
 * | `getHistoryDataBySensorId` | `historyData[id]` is set | Flat map. Note the key ignores data type, which is why weather history cannot be cached alongside pollution without a compound key. |
 *
 * Common to all six: a truthy check, so a cached `null` (the shape
 * `Forecast.fromApi` returns for an empty payload) counts as a miss and is
 * refetched. That is the existing behaviour and is left alone here.
 *
 * Nothing evicts. The cache lives as long as the page does.
 */
export const useCitiesStore = defineStore('cities', {
  state: (): CitiesState => ({
    cities: {},
    historyData: {},
    forecastBySensorId: {},
    pollutantsBySensorId: {},

    ...createRequestState(),
  }),

  getters: {
    isLoading: (state) => isLoading(state),
    hasError: (state) => hasError(state),
  },

  actions: {
    // --- request plumbing ---------------------------------------------------
    //
    // Both delegate to the useRequest composable, which owns the behaviour
    // while this store keeps owning the state.

    async request<T>(
      call: () => Promise<AxiosResponse<T>>
    ): Promise<RequestResult<T>> {
      return useRequest(this).run(call);
    },

    clearError() {
      useRequest(this).clearError();
    },

    // --- entity writes ------------------------------------------------------

    setSensorsByCity({
      cityName,
      sensors,
    }: {
      cityName: string | null | undefined;
      sensors: Array<Sensor | null>;
    }) {
      // Guards the city, not just the container. Clearing the city select
      // sends null, and an unknown name reaches here too; both used to throw
      // while assigning `.sensors` on undefined.
      const city = this.cities?.[cityName as string];
      if (!city) {
        return;
      }
      city.sensors = mapList(sensors, 'sensorId');
    },

    setForecastForSensor({
      sensorId,
      forecast,
      cityName,
    }: {
      sensorId: string | null | undefined;
      forecast: Forecast | null;
      cityName: string | null | undefined;
    }) {
      const sensor =
        this.cities?.[cityName as string]?.sensors?.[sensorId as string];
      if (!sensor) {
        return;
      }
      sensor.forecast = forecast;
    },

    setForecastForCity({
      forecast,
      cityName,
    }: {
      forecast: Forecast | null;
      cityName: string | null | undefined;
    }) {
      const city = this.cities?.[cityName as string];
      if (!city) {
        return;
      }
      city.forecast = forecast;
    },

    setPollutantsForSensor({
      sensorId,
      pollutants,
    }: {
      sensorId: string | null | undefined;
      pollutants: Array<Pollutant | null>;
    }) {
      this.pollutantsBySensorId = {
        ...this.pollutantsBySensorId,
        [sensorId as string]: pollutants,
      };
    },

    setHistoryData({
      sensorId,
      historyData,
    }: {
      sensorId: string | null | undefined;
      historyData: Forecast | null;
    }) {
      this.historyData = {
        ...this.historyData,
        [sensorId as string]: historyData,
      };
    },

    // --- data fetching ------------------------------------------------------
    // Each opens with the cache check the table above documents.

    /**
     * Returns an array on both paths. It used to return the Record when it
     * (nominally) hit the cache and an array otherwise, so the declared type
     * was a union no caller could act on without narrowing first.
     */
    async getCities(): Promise<City[]> {
      if (Object.keys(this.cities).length) {
        return Object.values(this.cities);
      }

      const { ok, data } = await this.request(() => aqra.getDataForAllCities());
      if (!ok) {
        return [];
      }

      this.cities = mapList(data.map(City.fromApi), 'cityName');

      return Object.values(this.cities);
    },

    async getSensorsByCityName(
      cityName: string | null | undefined
    ): Promise<Record<string, Sensor> | Array<Sensor | null>> {
      const cached = this.cities?.[cityName as string]?.sensors;
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getAvailableSensorsForCity(cityName)
      );
      if (!ok) {
        return [];
      }

      const sensors = data.map(Sensor.fromApi);
      this.setSensorsByCity({ sensors, cityName });
      return sensors;
    },

    async getSensorsForAllCities() {
      if (!this.cities) {
        return;
      }

      await mapWithConcurrency(Object.values(this.cities), (c) =>
        this.getSensorsByCityName(c.cityName)
      );
    },

    async getForecastForAllSensors() {
      if (!this.cities) {
        return;
      }

      await this.getSensorsForAllCities();

      const pairs = Object.values(this.cities)
        .map((c) =>
          Object.values(c.sensors || {}).map((s) => ({
            sensorId: s.sensorId,
            cityName: c.cityName,
          }))
        )
        .flat();

      await mapWithConcurrency(pairs, (pair) =>
        this.getForecastBySensorId(pair)
      );
    },

    async getForecastForAllCities() {
      if (!this.cities) {
        return;
      }

      await mapWithConcurrency(Object.values(this.cities), (c) =>
        this.getForecastByCoordinatesForCity({
          position: c.position,
          cityName: c.cityName,
        })
      );
    },

    async getForecastByCoordinatesForCity({
      position,
      cityName,
    }: {
      position: Position;
      cityName: string | null | undefined;
    }): Promise<Forecast | null | never[]> {
      // Identity comparison, not a value comparison -- see the policy table.
      const cached = Object.values(this.cities).find(
        (c) => c.position === position
      )?.forecast;
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getForecastBySpecificCoordinates(position?.[0], position?.[1])
      );
      if (!ok) {
        return [];
      }

      const forecast = Forecast.fromApi(data);
      this.setForecastForCity({ forecast, cityName });
      return forecast;
    },

    async getForecastBySensorId({
      sensorId,
      cityName,
    }: {
      sensorId: string | null | undefined;
      cityName: string | null | undefined;
    }): Promise<Forecast | null | never[]> {
      const cached =
        this.cities?.[cityName as string]?.sensors?.[sensorId as string]
          ?.forecast;
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getForecastForSpecificSensor(cityName, sensorId)
      );
      if (!ok) {
        return [];
      }

      const forecast = Forecast.fromApi(data);
      this.setForecastForSensor({ sensorId, forecast, cityName });
      return forecast;
    },

    /**
     * `cityName` is a parameter here, where the store version read it off
     * `nameInput.value`. That read was the only thing tying the entity cache to
     * the filter inputs; passing it keeps this store ignorant of the filters.
     */
    async getPollutantsBySensorId(
      cityName: string | null | undefined,
      sensorId: string | null | undefined
    ): Promise<Array<Pollutant | null>> {
      const cached = this.pollutantsBySensorId?.[sensorId as string];
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForAllAvailablePollutantsBySensorId(cityName, sensorId)
      );
      if (!ok) {
        return [];
      }

      const pollutants = data.map(Pollutant.fromApi);
      this.setPollutantsForSensor({ sensorId, pollutants });
      return pollutants;
    },

    /** `cityName` is a parameter for the same reason as above. */
    async getHistoryDataBySensorId(
      cityName: string | null | undefined,
      sensorId: string | null | undefined
    ): Promise<Forecast | null | never[]> {
      const cached = this.historyData?.[sensorId as string];
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForHistoricalPollution(cityName, sensorId)
      );
      if (!ok) {
        return [];
      }

      const historyData = Forecast.fromApi(data);
      this.setHistoryData({ sensorId, historyData });
      return historyData;
    },
  },
});
