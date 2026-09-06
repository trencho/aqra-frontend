import { defineStore } from 'pinia';

import type { City } from '@/classes/city';
import type { Pollutant } from '@/classes/pollutant';
import type { Sensor } from '@/classes/sensors';
import { Pollutants, PollutantsLabels } from '@/constants/pollutants';
import { useCitiesStore } from '@/stores/cities';
import type {
  SelectFilterInput,
  SelectOption,
  SetValueConfig,
  ToggleFilterInput,
} from '@/types/domain';

export interface FiltersState {
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

/**
 * The filter controls: what the selects and toggles hold, and what a change to
 * one of them sets off.
 *
 * Two pages build these slots differently -- the Map page adds five toggles the
 * Statistics page has none of -- which is why the eight `{} as ...` assertions
 * below exist. Keeping that in its own store makes it a filters concern rather
 * than something a store full of API data also happens to do.
 *
 * This store reads the entity cache (to build the city options) and calls its
 * fetchers, never the other way round. The dependency runs one way: filters
 * know about cities, cities know nothing about a select.
 */
export const useFiltersStore = defineStore('filters', {
  // Annotated rather than inferred. Inferred, every one of the eight fields
  // below is `{}`, and every downstream `.value` / `.items` / `.hidden` read is
  // untyped.
  //
  // The eight assertions record a real window: these start empty and are
  // replaced wholesale by initMapPage() or initStatisticPage() before anything
  // reads them. Typing them as Partial<...> instead would push
  // undefined-handling into every consumer for a state that is never actually
  // observed empty.
  state: (): FiltersState => ({
    nameInput: {} as SelectFilterInput,
    sensorInput: {} as SelectFilterInput,
    pollutantInput: {} as SelectFilterInput,
    showCityMarkersInput: {} as ToggleFilterInput,
    showForAllCitiesInput: {} as ToggleFilterInput,
    showSensorMarkersInput: {} as ToggleFilterInput,
    showForAllSensorsInput: {} as ToggleFilterInput,
    showCityBoundariesInput: {} as ToggleFilterInput,
  }),

  actions: {
    // --- input mutation -----------------------------------------------------

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
      Object.assign(this, cityFilterInputs(useCitiesStore().cities));
    },

    initMapPage() {
      Object.assign(this, cityFilterInputs(useCitiesStore().cities));

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

    // --- dispatch -----------------------------------------------------------

    /**
     * Every filter change in the app lands here.
     *
     * Six arms on `input.id`, and the two reads of `nameInput.value` in the
     * 'sensor' and 'pollutant' arms are the reason this belongs with the inputs
     * rather than with the cache: the city being fetched for is whatever the
     * city select holds, which is a filters fact.
     */
    async setValue(config: SetValueConfig) {
      const cities = useCitiesStore();

      config.input.value = config.value;

      // The `as` casts below are what the switch establishes: a 'name' case
      // carries a city name, a 'showForAllCities' case carries a boolean. The
      // correlation is real but lives in the emitting component, not the type.
      switch (config.input.id) {
        case 'name': {
          const sensors = await cities.getSensorsByCityName(
            config.value as string
          );
          this.setSensorInputOptions(Object.values(sensors));
          break;
        }
        case 'sensor': {
          const pollutants = await cities.getPollutantsBySensorId(
            this.nameInput.value as string,
            config.value as string
          );
          this.setPollutantInputOptions(pollutants);
          await cities.getHistoryDataBySensorId(
            this.nameInput.value as string,
            config.value as string
          );
          break;
        }
        case 'pollutant':
          if (
            !this.showForAllCitiesInput.value &&
            !this.showForAllSensorsInput.value
          ) {
            await cities.getForecastBySensorId({
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
          await cities.getForecastForAllCities();
          break;
        }
        case 'showForAllSensors': {
          this.setShowAllSensors(config.value as boolean);
          await cities.getForecastForAllSensors();
          break;
        }
        case 'showSensorMarkers': {
          await cities.getSensorsForAllCities();
          break;
        }
      }
    },
  },
});
