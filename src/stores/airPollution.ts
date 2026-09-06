import type { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';

import type { City } from '@/classes/city';
import type { Forecast } from '@/classes/forecast';
import type { Pollutant } from '@/classes/pollutant';
import type { Sensor } from '@/classes/sensors';
import type { RequestResult } from '@/composables/useRequest';
import { useCitiesStore } from '@/stores/cities';
import { useFiltersStore } from '@/stores/filters';
import type {
  Position,
  SelectFilterInput,
  SetValueConfig,
  ToggleFilterInput,
} from '@/types/domain';

type CitiesStore = ReturnType<typeof useCitiesStore>;

/**
 * The original air-pollution store, now a facade over the three that replaced
 * it: stores/cities.ts holds the entity graph and the request plumbing,
 * stores/filters.ts holds the selects and the dispatch, stores/ui.ts holds the
 * drawer and the active tab.
 *
 * It exists so the split did not have to land as one commit touching every
 * component: six components call `mapStores(useAirPollutionStore)` and the
 * component specs drive these names. Nothing new should be added here -- a new
 * consumer should reach for the store that owns what it needs.
 *
 * **Everything below is a getter or a delegating action, and that distinction
 * is the one thing to keep straight.** Delegating an action is safe: it
 * forwards a call. Delegating state through a getter is read-only by
 * construction, which is what makes it honest -- an assignment fails to compile
 * instead of writing to a copy nobody else sees, and `initialState` in a spec
 * has to name the owning store. Both of those turned up as compiler errors
 * during the split rather than as silent wrong behaviour; ui.ts records the one
 * case where a getter would have swallowed a seed instead.
 */
export const useAirPollutionStore = defineStore('airPollution', {
  getters: {
    // --- filters ------------------------------------------------------------
    nameInput: (): SelectFilterInput => useFiltersStore().nameInput,
    sensorInput: (): SelectFilterInput => useFiltersStore().sensorInput,
    pollutantInput: (): SelectFilterInput => useFiltersStore().pollutantInput,
    showCityMarkersInput: (): ToggleFilterInput =>
      useFiltersStore().showCityMarkersInput,
    showForAllCitiesInput: (): ToggleFilterInput =>
      useFiltersStore().showForAllCitiesInput,
    showSensorMarkersInput: (): ToggleFilterInput =>
      useFiltersStore().showSensorMarkersInput,
    showForAllSensorsInput: (): ToggleFilterInput =>
      useFiltersStore().showForAllSensorsInput,
    showCityBoundariesInput: (): ToggleFilterInput =>
      useFiltersStore().showCityBoundariesInput,

    // --- entity graph -------------------------------------------------------
    cities: (): Record<string, City> => useCitiesStore().cities,
    historyData: (): Record<string, Forecast | null> =>
      useCitiesStore().historyData,
    forecastBySensorId: (): Record<string, Forecast | null> =>
      useCitiesStore().forecastBySensorId,
    pollutantsBySensorId: (): Record<string, Array<Pollutant | null>> =>
      useCitiesStore().pollutantsBySensorId,

    // --- request plumbing ---------------------------------------------------
    error: (): string | null => useCitiesStore().error,
    pending: (): number => useCitiesStore().pending,
    isLoading: (): boolean => useCitiesStore().isLoading,
    hasError: (): boolean => useCitiesStore().hasError,
  },

  actions: {
    // --- request plumbing ---------------------------------------------------

    async request<T>(
      call: () => Promise<AxiosResponse<T>>
    ): Promise<RequestResult<T>> {
      return useCitiesStore().request(call);
    },

    clearError() {
      useCitiesStore().clearError();
    },

    // --- filters ------------------------------------------------------------

    setSensorInputOptions(options: Array<Sensor | null>) {
      useFiltersStore().setSensorInputOptions(options);
    },

    setPollutantInputOptions(options: Array<Pollutant | null>) {
      useFiltersStore().setPollutantInputOptions(options);
    },

    setShowAllCities(value: boolean) {
      useFiltersStore().setShowAllCities(value);
    },

    setShowAllSensors(value: boolean) {
      useFiltersStore().setShowAllSensors(value);
    },

    initStatisticPage() {
      useFiltersStore().initStatisticPage();
    },

    initMapPage() {
      useFiltersStore().initMapPage();
    },

    async setValue(config: SetValueConfig) {
      return useFiltersStore().setValue(config);
    },

    /** The one action with no single owner: it is the Home page's boot. */
    async initHomePage() {
      await useCitiesStore().getCities();
    },

    // --- entity writes and fetching -----------------------------------------

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
     * The city comes off the filters store's `nameInput`, which is where the
     * cities store's two-argument signature expects the caller to get it.
     */
    async getPollutantsBySensorId(sensorId: string | null | undefined) {
      return useCitiesStore().getPollutantsBySensorId(
        useFiltersStore().nameInput.value as string,
        sensorId
      );
    },

    /** Same as above. */
    async getHistoryDataBySensorId(sensorId: string | null | undefined) {
      return useCitiesStore().getHistoryDataBySensorId(
        useFiltersStore().nameInput.value as string,
        sensorId
      );
    },
  },
});
