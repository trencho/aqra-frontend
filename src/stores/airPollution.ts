import type { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';

import { City } from '@/classes/city';
import { Forecast } from '@/classes/forecast';
import { Pollutant } from '@/classes/pollutant';
import { Sensor } from '@/classes/sensors';
import type { TabId } from '@/constants/navigationTabs';
import { TabIds } from '@/constants/navigationTabs';
import { Pollutants, PollutantsLabels } from '@/constants/pollutants';
import { aqra } from '@/services/api';
import type {
  Position,
  SelectFilterInput,
  SelectOption,
  SetValueConfig,
  ToggleFilterInput,
} from '@/types/domain';
import { mapWithConcurrency } from '@/utils/concurrency';
import { errorMessage } from '@/utils/errors';

export interface AirPollutionState {
  drawer: boolean;

  cities: Record<string, City>;
  nameInput: SelectFilterInput;
  sensorInput: SelectFilterInput;
  historyData: Record<string, Forecast | null>;
  pollutantInput: SelectFilterInput;
  tabId: TabId;
  forecastBySensorId: Record<string, Forecast | null>;
  pollutantsBySensorId: Record<string, Array<Pollutant | null>>;
  showCityMarkersInput: ToggleFilterInput;
  showForAllCitiesInput: ToggleFilterInput;
  showSensorMarkersInput: ToggleFilterInput;
  showForAllSensorsInput: ToggleFilterInput;
  showCityBoundariesInput: ToggleFilterInput;

  /** Last request failure, for display. Null when the last attempt succeeded. */
  error: string | null;
  /** Number of requests currently in flight. */
  pending: number;
}

/**
 * A discriminated union so `if (!ok) return []` narrows `data` to non-null in
 * the branch that follows. A plain `{ ok: boolean; data: T | null }` would leave
 * every caller asserting.
 */
type RequestResult<T> = { ok: true; data: T } | { ok: false; data: null };

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

function mapPollutants(): SelectOption[] {
  return Object.values(Pollutants).map((p) => ({
    label: PollutantsLabels[p],
    value: p,
  }));
}

/**
 * The three select filters, rebuilt from scratch on entering a page.
 *
 * `{} as SelectFilterInput` appears in the initial state below rather than here;
 * this function always returns fully-formed inputs.
 */
function cityFilterInputs(cities: Record<string, City> | undefined) {
  return {
    nameInput: {
      id: 'name',
      label: 'common.cityName',
      value: null,
      hidden: false,
      items: (cities ? Object.values(cities) : []).map((c) => ({
        label: c.siteName,
        value: c.cityName,
      })),
    } satisfies SelectFilterInput,
    sensorInput: {
      id: 'sensor',
      label: 'common.sensors',
      value: null,
      hidden: false,
      items: [],
    } satisfies SelectFilterInput,
    pollutantInput: {
      id: 'pollutant',
      label: 'common.pollutants',
      value: null,
      items: [],
    } satisfies SelectFilterInput,
  };
}

export const useAirPollutionStore = defineStore('airPollution', {
  // Annotated, which is the substance of converting this file. Inferred, every
  // one of the eight filter-input fields below is `{}`, and every downstream
  // `.value` / `.items` / `.hidden` / `.sensors` read is untyped.
  //
  // The eight `{} as ...` assertions record a real window: these start empty and
  // are replaced wholesale by initMapPage() or initStatisticPage() before
  // anything reads them. Typing them as Partial<...> instead would push
  // undefined-handling into every consumer for a state that is never actually
  // observed empty.
  state: (): AirPollutionState => ({
    drawer: false,

    cities: {},
    nameInput: {} as SelectFilterInput,
    sensorInput: {} as SelectFilterInput,
    historyData: {},
    pollutantInput: {} as SelectFilterInput,
    tabId: TabIds.Home,
    forecastBySensorId: {},
    pollutantsBySensorId: {},
    showCityMarkersInput: {} as ToggleFilterInput,
    showForAllCitiesInput: {} as ToggleFilterInput,
    showSensorMarkersInput: {} as ToggleFilterInput,
    showForAllSensorsInput: {} as ToggleFilterInput,
    showCityBoundariesInput: {} as ToggleFilterInput,

    error: null,
    pending: 0,
  }),

  getters: {
    isLoading: (state) => state.pending > 0,
    hasError: (state) => state.error !== null,
  },

  actions: {
    // --- request plumbing ---------------------------------------------------

    /**
     * Run an API call, converting every failure into store state instead of an
     * unhandled rejection.
     *
     * Every action used to test `result.status === 200` and do nothing
     * otherwise -- but axios rejects on 4xx/5xx rather than resolving, so that
     * check never saw a failure and the rejection escaped the action entirely.
     * There was no try/catch anywhere in src/, so a single failed request left
     * the UI stuck with no feedback.
     */
    async request<T>(
      call: () => Promise<AxiosResponse<T>>
    ): Promise<RequestResult<T>> {
      this.pending += 1;
      try {
        const result = await call();

        if (result?.status === 200) {
          this.error = null;
          return { ok: true, data: result.data };
        }

        this.error = `Request failed with status ${result?.status ?? 'unknown'}`;
        return { ok: false, data: null };
      } catch (cause) {
        // `cause` is typed unknown under strict (useUnknownInCatchVariables),
        // so the narrowing lives in one shared helper rather than here.
        this.error = errorMessage(cause, 'Request failed');
        return { ok: false, data: null };
      } finally {
        this.pending -= 1;
      }
    },

    clearError() {
      this.error = null;
    },

    // --- formerly mutations -------------------------------------------------

    setSensorInputOptions(options: Array<Sensor | null>) {
      this.sensorInput.value = null;
      this.pollutantInput.value = null;
      this.sensorInput.items = (options || []).map((o) => ({
        label: o?.description,
        value: o?.sensorId,
      }));
    },

    setPollutantInputOptions(options: Array<Pollutant | null>) {
      this.pollutantInput.value = null;
      this.pollutantInput.items = (options || []).map((o) => ({
        label: o?.name,
        value: o?.value,
      }));
    },

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

    setShowAllCities(value: boolean) {
      this.showForAllSensorsInput.value = false;
      this.nameInput.hidden = value;
      this.sensorInput.hidden = value;
      this.nameInput.value = value ? null : this.nameInput.value;
      this.sensorInput.value = value ? null : this.sensorInput.value;
      this.pollutantInput.items = value ? mapPollutants() : [];
      this.pollutantInput.value = null;
    },

    setShowAllSensors(value: boolean) {
      this.showForAllCitiesInput.value = false;
      this.nameInput.hidden = value;
      this.sensorInput.hidden = value;
      this.nameInput.value = value ? null : this.nameInput.value;
      this.sensorInput.value = value ? null : this.sensorInput.value;
      this.pollutantInput.items = value ? mapPollutants() : [];
      this.pollutantInput.value = null;
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

    // --- page initialisation ------------------------------------------------

    initStatisticPage() {
      Object.assign(this, cityFilterInputs(this.cities));
    },

    initMapPage() {
      Object.assign(this, cityFilterInputs(this.cities));

      this.showForAllCitiesInput = {
        id: 'showForAllCities',
        label: 'common.showForecastForAllCities',
        value: false,
      };
      this.showCityBoundariesInput = {
        id: 'showCityBoundaries',
        label: 'common.showCityBoundaries',
        value: false,
      };
      this.showCityMarkersInput = {
        id: 'showCityMarkers',
        label: 'common.showCityMarkers',
        value: true,
      };
      this.showForAllSensorsInput = {
        id: 'showForAllSensors',
        label: 'common.showForecastForAllSensors',
        value: false,
      };
      this.showSensorMarkersInput = {
        id: 'showSensorMarkers',
        label: 'common.showSensorMarkers',
        value: false,
      };
    },

    async initHomePage() {
      await this.getCities();
    },

    // --- ui -----------------------------------------------------------------

    setDrawer(drawer: boolean) {
      this.drawer = drawer;
    },

    changeTab(id: TabId) {
      if (id !== this.tabId) {
        this.drawer = false;
      }
      this.tabId = id;
    },

    async setValue(config: SetValueConfig) {
      config.input.value = config.value;

      // The `as` casts below are what the switch establishes: a 'name' case
      // carries a city name, a 'showForAllCities' case carries a boolean. The
      // correlation is real but lives in the emitting component, not the type.
      switch (config.input.id) {
        case 'name': {
          const sensors = await this.getSensorsByCityName(
            config.value as string
          );
          this.setSensorInputOptions(Object.values(sensors));
          break;
        }
        case 'sensor': {
          const pollutants = await this.getPollutantsBySensorId(
            config.value as string
          );
          this.setPollutantInputOptions(pollutants);
          await this.getHistoryDataBySensorId(config.value as string);
          break;
        }
        case 'pollutant':
          if (
            !this.showForAllCitiesInput.value &&
            !this.showForAllSensorsInput.value
          ) {
            await this.getForecastBySensorId({
              // Both selects are single-valued on the Map page, where this arm
              // runs. SelectFilterInput.value is the union of what the Map and
              // Statistics pages store -- only the latter is multi-valued.
              sensorId: this.sensorInput.value as string,
              cityName: this.nameInput.value as string,
            });
          }
          break;
        case 'showForAllCities': {
          this.setShowAllCities(config.value as boolean);
          await this.getForecastForAllCities();
          break;
        }
        case 'showForAllSensors': {
          this.setShowAllSensors(config.value as boolean);
          await this.getForecastForAllSensors();
          break;
        }
        case 'showSensorMarkers': {
          await this.getSensorsForAllCities();
          break;
        }
      }
    },

    // --- data fetching ------------------------------------------------------

    /**
     * The cache check used to be `this.cities.length`. `cities` is a Record
     * keyed by city name, so that is always `undefined` and the guard never
     * fired: every call refetched every city. Typing the state is what exposed
     * it, and it was left in place through the migration so the behaviour
     * change would not be buried in a type change.
     *
     * Returns an array on both paths now. It used to return the Record when it
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
      // Identity comparison, not a value comparison: two cities with equal
      // coordinates in different array instances both miss. Test fixtures that
      // share one position array collapse into cache hits for the same reason.
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

    async getPollutantsBySensorId(
      sensorId: string | null | undefined
    ): Promise<Array<Pollutant | null>> {
      const cached = this.pollutantsBySensorId?.[sensorId as string];
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForAllAvailablePollutantsBySensorId(
          this.nameInput.value as string,
          sensorId
        )
      );
      if (!ok) {
        return [];
      }

      const pollutants = data.map(Pollutant.fromApi);
      this.setPollutantsForSensor({ sensorId, pollutants });
      return pollutants;
    },

    async getHistoryDataBySensorId(
      sensorId: string | null | undefined
    ): Promise<Forecast | null | never[]> {
      const cached = this.historyData?.[sensorId as string];
      if (cached) {
        return cached;
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForHistoricalPollution(
          this.nameInput.value as string,
          sensorId
        )
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
