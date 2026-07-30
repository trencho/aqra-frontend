import { defineStore } from 'pinia';

import { City } from '@/classes/city';
import { Forecast } from '@/classes/forecast';
import { Pollutant } from '@/classes/pollutant';
import { Sensor } from '@/classes/sensors';
import { TabIds } from '@/constants/navigationTabs';
import { Pollutants, PollutantsLabels } from '@/constants/pollutants';
import { aqra } from '@/services/api';
import { mapWithConcurrency } from '@/utils/concurrency';

function mapList(list, entity) {
  const map = {};
  list.forEach((i) => (map[i[entity]] = i));
  return map;
}

function mapPollutants() {
  return Object.values(Pollutants).map((p) => ({
    label: PollutantsLabels[p],
    value: p,
  }));
}

function cityFilterInputs(cities) {
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
    },
    sensorInput: {
      id: 'sensor',
      label: 'common.sensors',
      value: null,
      hidden: false,
      items: [],
    },
    pollutantInput: {
      id: 'pollutant',
      label: 'common.pollutants',
      value: null,
      items: [],
    },
  };
}

export const useAirPollutionStore = defineStore('airPollution', {
  state: () => ({
    drawer: false,

    cities: {},
    nameInput: {},
    sensorInput: {},
    historyData: {},
    pollutantInput: {},
    tabId: TabIds.Home,
    forecastBySensorId: {},
    pollutantsBySensorId: {},
    showCityMarkersInput: {},
    showForAllCitiesInput: {},
    showSensorMarkersInput: {},
    showForAllSensorsInput: {},
    showCityBoundariesInput: {},

    /** Last request failure, for display. Null when the last attempt succeeded. */
    error: null,
    /** Number of requests currently in flight. */
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
     *
     * @returns {Promise<{ok: boolean, data: any}>}
     */
    async request(call) {
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
        this.error = cause?.message ?? 'Request failed';
        return { ok: false, data: null };
      } finally {
        this.pending -= 1;
      }
    },

    clearError() {
      this.error = null;
    },

    // --- formerly mutations -------------------------------------------------

    setSensorInputOptions(options) {
      this.sensorInput.value = null;
      this.pollutantInput.value = null;
      this.sensorInput.items = (options || []).map((o) => ({
        label: o.description,
        value: o.sensorId,
      }));
    },

    setPollutantInputOptions(options) {
      this.pollutantInput.value = null;
      this.pollutantInput.items = (options || []).map((o) => ({
        label: o.name,
        value: o.value,
      }));
    },

    setSensorsByCity({ cityName, sensors }) {
      // Guards the city, not just the container. Clearing the city select
      // sends null, and an unknown name reaches here too; both used to throw
      // while assigning `.sensors` on undefined.
      const city = this.cities?.[cityName];
      if (!city) {
        return;
      }
      city.sensors = mapList(sensors, 'sensorId');
    },

    setForecastForSensor({ sensorId, forecast, cityName }) {
      const sensor = this.cities?.[cityName]?.sensors?.[sensorId];
      if (!sensor) {
        return;
      }
      sensor.forecast = forecast;
    },

    setForecastForCity({ forecast, cityName }) {
      const city = this.cities?.[cityName];
      if (!city) {
        return;
      }
      city.forecast = forecast;
    },

    setPollutantsForSensor({ sensorId, pollutants }) {
      this.pollutantsBySensorId = {
        ...this.pollutantsBySensorId,
        [sensorId]: pollutants,
      };
    },

    setShowAllCities(value) {
      this.showForAllSensorsInput.value = false;
      this.nameInput.hidden = value;
      this.sensorInput.hidden = value;
      this.nameInput.value = value ? null : this.nameInput.value;
      this.sensorInput.value = value ? null : this.sensorInput.value;
      this.pollutantInput.items = value ? mapPollutants() : [];
      this.pollutantInput.value = null;
    },

    setShowAllSensors(value) {
      this.showForAllCitiesInput.value = false;
      this.nameInput.hidden = value;
      this.sensorInput.hidden = value;
      this.nameInput.value = value ? null : this.nameInput.value;
      this.sensorInput.value = value ? null : this.sensorInput.value;
      this.pollutantInput.items = value ? mapPollutants() : [];
      this.pollutantInput.value = null;
    },

    setHistoryData({ sensorId, historyData }) {
      this.historyData = {
        ...this.historyData,
        [sensorId]: historyData,
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

    setDrawer(drawer) {
      this.drawer = drawer;
    },

    changeTab(id) {
      if (id !== this.tabId) {
        this.drawer = false;
      }
      this.tabId = id;
    },

    async setValue(config) {
      config.input.value = config.value;

      switch (config.input.id) {
        case 'name': {
          const sensors = await this.getSensorsByCityName(config.value);
          this.setSensorInputOptions(Object.values(sensors));
          break;
        }
        case 'sensor': {
          const pollutants = await this.getPollutantsBySensorId(config.value);
          this.setPollutantInputOptions(pollutants);
          await this.getHistoryDataBySensorId(config.value);
          break;
        }
        case 'pollutant':
          if (
            !this.showForAllCitiesInput.value &&
            !this.showForAllSensorsInput.value
          ) {
            await this.getForecastBySensorId({
              sensorId: this.sensorInput.value,
              cityName: this.nameInput.value,
            });
          }
          break;
        case 'showForAllCities': {
          this.setShowAllCities(config.value);
          await this.getForecastForAllCities();
          break;
        }
        case 'showForAllSensors': {
          this.setShowAllSensors(config.value);
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

    async getCities() {
      if (this.cities?.length) {
        return this.cities;
      }

      const { ok, data } = await this.request(() => aqra.getDataForAllCities());
      if (!ok) {
        return [];
      }

      const cities = data.map(City.fromApi);
      this.cities = mapList(cities, 'cityName');

      return cities;
    },

    async getSensorsByCityName(cityName) {
      if (this.cities?.[cityName]?.sensors) {
        return this.cities[cityName].sensors;
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

    async getForecastByCoordinatesForCity({ position, cityName }) {
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

    async getForecastBySensorId({ sensorId, cityName }) {
      const cached = this.cities?.[cityName]?.sensors?.[sensorId]?.forecast;
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

    async getPollutantsBySensorId(sensorId) {
      if (this.pollutantsBySensorId?.[sensorId]) {
        return this.pollutantsBySensorId[sensorId];
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForAllAvailablePollutantsBySensorId(
          this.nameInput.value,
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

    async getHistoryDataBySensorId(sensorId) {
      if (this.historyData?.[sensorId]) {
        return this.historyData[sensorId];
      }

      const { ok, data } = await this.request(() =>
        aqra.getDataForHistoricalPollution(this.nameInput.value, sensorId)
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
