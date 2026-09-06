import type { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';

import type { City } from '@/classes/city';
import type { Forecast } from '@/classes/forecast';
import type { Pollutant } from '@/classes/pollutant';
import type { Sensor } from '@/classes/sensors';
import type { RequestResult } from '@/composables/useRequest';
import { Pollutants, PollutantsLabels } from '@/constants/pollutants';
import { useCitiesStore } from '@/stores/cities';
import type {
  Position,
  SelectFilterInput,
  SelectOption,
  SetValueConfig,
  ToggleFilterInput,
} from '@/types/domain';

type CitiesStore = ReturnType<typeof useCitiesStore>;

export interface AirPollutionState {
  nameInput: SelectFilterInput;
  sensorInput: SelectFilterInput;
  pollutantInput: SelectFilterInput;
  showCityMarkersInput: ToggleFilterInput;
  showForAllCitiesInput: ToggleFilterInput;
  showSensorMarkersInput: ToggleFilterInput;
  showForAllSensorsInput: ToggleFilterInput;
  showCityBoundariesInput: ToggleFilterInput;
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
    nameInput: {} as SelectFilterInput,
    sensorInput: {} as SelectFilterInput,
    pollutantInput: {} as SelectFilterInput,
    showCityMarkersInput: {} as ToggleFilterInput,
    showForAllCitiesInput: {} as ToggleFilterInput,
    showSensorMarkersInput: {} as ToggleFilterInput,
    showForAllSensorsInput: {} as ToggleFilterInput,
    showCityBoundariesInput: {} as ToggleFilterInput,
  }),

  // Read-only passthroughs to the cities store. Getters rather than state, so
  // there is exactly one copy of the entity graph and no synchronisation to get
  // wrong. Map.vue reads `store.cities` and Statistics.vue reads
  // `store.historyData` through these and needed no edit.
  getters: {
    cities: (): Record<string, City> => useCitiesStore().cities,
    historyData: (): Record<string, Forecast | null> =>
      useCitiesStore().historyData,
    forecastBySensorId: (): Record<string, Forecast | null> =>
      useCitiesStore().forecastBySensorId,
    pollutantsBySensorId: (): Record<string, Array<Pollutant | null>> =>
      useCitiesStore().pollutantsBySensorId,

    error: (): string | null => useCitiesStore().error,
    pending: (): number => useCitiesStore().pending,
    isLoading: (): boolean => useCitiesStore().isLoading,
    hasError: (): boolean => useCitiesStore().hasError,
  },

  actions: {
    // --- facade: request plumbing -------------------------------------------
    //
    // The state lives in the cities store now. These stay because HomePage.vue
    // binds `store.clearError()` and both specs drive `store.request(...)`.

    async request<T>(
      call: () => Promise<AxiosResponse<T>>
    ): Promise<RequestResult<T>> {
      return useCitiesStore().request(call);
    },

    clearError() {
      useCitiesStore().clearError();
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

    // --- facade: entity writes and fetching ---------------------------------
    //
    // Every one of these moved to stores/cities.ts. They are re-exported here
    // because ten components call mapStores(useAirPollutionStore) and the
    // component specs drive them by these names. Delegating actions is safe in
    // a way delegating state is not: an action forwards a call, where a state
    // getter silently swallows anything a test seeds through initialState.

    setSensorsByCity(payload: Parameters<CitiesStore['setSensorsByCity']>[0]) {
      useCitiesStore().setSensorsByCity(payload);
    },

    setForecastForSensor(
      payload: Parameters<CitiesStore['setForecastForSensor']>[0]
    ) {
      useCitiesStore().setForecastForSensor(payload);
    },

    setForecastForCity(
      payload: Parameters<CitiesStore['setForecastForCity']>[0]
    ) {
      useCitiesStore().setForecastForCity(payload);
    },

    setPollutantsForSensor(
      payload: Parameters<CitiesStore['setPollutantsForSensor']>[0]
    ) {
      useCitiesStore().setPollutantsForSensor(payload);
    },

    setHistoryData(payload: Parameters<CitiesStore['setHistoryData']>[0]) {
      useCitiesStore().setHistoryData(payload);
    },

    async getCities() {
      return useCitiesStore().getCities();
    },

    async getSensorsByCityName(cityName: string | null | undefined) {
      return useCitiesStore().getSensorsByCityName(cityName);
    },

    async getSensorsForAllCities() {
      return useCitiesStore().getSensorsForAllCities();
    },

    async getForecastForAllSensors() {
      return useCitiesStore().getForecastForAllSensors();
    },

    async getForecastForAllCities() {
      return useCitiesStore().getForecastForAllCities();
    },

    async getForecastByCoordinatesForCity(payload: {
      position: Position;
      cityName: string | null | undefined;
    }) {
      return useCitiesStore().getForecastByCoordinatesForCity(payload);
    },

    async getForecastBySensorId(payload: {
      sensorId: string | null | undefined;
      cityName: string | null | undefined;
    }) {
      return useCitiesStore().getForecastBySensorId(payload);
    },

    /**
     * The city comes off `nameInput.value` here rather than inside the cities
     * store. That read is the one coupling between the filters and the entity
     * cache, and this facade is the right place for it: the cities store takes
     * the name as a parameter and knows nothing about a select.
     */
    async getPollutantsBySensorId(sensorId: string | null | undefined) {
      return useCitiesStore().getPollutantsBySensorId(
        this.nameInput.value as string,
        sensorId
      );
    },

    /** Same as above. */
    async getHistoryDataBySensorId(sensorId: string | null | undefined) {
      return useCitiesStore().getHistoryDataBySensorId(
        this.nameInput.value as string,
        sensorId
      );
    },
  },
});
