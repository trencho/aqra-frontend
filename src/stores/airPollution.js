import { defineStore } from 'pinia';

import { City } from '@/classes/city';
import { Sensor } from '@/classes/sensors';
import { Pollutant } from '@/classes/pollutant';
import { Forecast } from '@/classes/forecast';
import { aqra } from '@/services/api';
import { TabIds } from '@/constants/navigationTabs';
import { Pollutants, PollutantsLabels } from '@/constants/pollutants';

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
  }),

  actions: {
    // --- formerly mutations -------------------------------------------------
    // Pinia has no separate mutation concept: these mutate state directly and
    // are called by the async actions below.

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
      if (!this.cities) {
        return;
      }
      this.cities[cityName].sensors = mapList(sensors, 'sensorId');
    },

    setForecastForSensor({ sensorId, forecast, cityName }) {
      if (!this.cities[cityName].sensors) {
        return;
      }
      const selected = this.cities[cityName].sensors?.[sensorId];
      selected.forecast = forecast;
    },

    setForecastForCity({ forecast, cityName }) {
      this.cities[cityName].forecast = forecast;
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
      const result = await aqra.getDataForAllCities();

      if (result.status === 200) {
        const cities = result.data.map(City.fromApi);
        this.cities = mapList(cities, 'cityName');

        return cities;
      }

      return [];
    },

    async getSensorsByCityName(cityName) {
      if (this.cities?.[cityName]?.sensors) {
        return this.cities?.[cityName].sensors;
      }
      const result = await aqra.getAvailableSensorsForCity(cityName);
      if (result.status === 200) {
        const sensors = result.data.map(Sensor.fromApi);
        this.setSensorsByCity({ sensors, cityName });
        return sensors;
      }

      return [];
    },

    async getSensorsForAllCities() {
      if (!this.cities) {
        return;
      }

      await Promise.all(
        Object.values(this.cities).map((c) =>
          this.getSensorsByCityName(c.cityName)
        )
      );
    },

    async getForecastForAllSensors() {
      if (!this.cities) {
        return;
      }

      await this.getSensorsForAllCities();
      await Promise.all(
        Object.values(this.cities)
          .map((c) =>
            Object.values(c.sensors || {}).map((s) =>
              this.getForecastBySensorId({
                sensorId: s.sensorId,
                cityName: c.cityName,
              })
            )
          )
          .flat()
      );
    },

    async getForecastForAllCities() {
      if (!this.cities) {
        return;
      }

      await Promise.all(
        Object.values(this.cities).map((c) =>
          this.getForecastByCoordinatesForCity({
            position: c.position,
            cityName: c.cityName,
          })
        )
      );
    },

    async getForecastByCoordinatesForCity({ position, cityName }) {
      const cached = Object.values(this.cities).find(
        (c) => c.position === position
      )?.forecast;
      if (cached) {
        return cached;
      }
      const result = await aqra.getForecastBySpecificCoordinates(
        position[0],
        position[1]
      );
      if (result.status === 200) {
        const forecast = Forecast.fromApi(result.data);

        this.setForecastForCity({ forecast, cityName });
        return forecast;
      }

      return [];
    },

    async getForecastBySensorId({ sensorId, cityName }) {
      const cached = this.cities?.[cityName]?.sensors?.[sensorId]?.forecast;
      if (cached) {
        return cached;
      }
      const result = await aqra.getForecastForSpecificSensor(
        cityName,
        sensorId
      );
      if (result.status === 200) {
        const forecast = Forecast.fromApi(result.data);

        this.setForecastForSensor({ sensorId, forecast, cityName });
        return forecast;
      }

      return [];
    },

    async getPollutantsBySensorId(sensorId) {
      if (this.pollutantsBySensorId?.[sensorId]) {
        return this.pollutantsBySensorId?.[sensorId];
      }
      const result = await aqra.getDataForAllAvailablePollutantsBySensorId(
        this.nameInput.value,
        sensorId
      );
      if (result.status === 200) {
        const pollutants = result.data.map(Pollutant.fromApi);

        this.setPollutantsForSensor({ sensorId, pollutants });
        return pollutants;
      }

      return [];
    },

    async getHistoryDataBySensorId(sensorId) {
      if (this.historyData?.[sensorId]) {
        return this.historyData?.[sensorId];
      }
      const result = await aqra.getDataForHistoricalPollution(
        this.nameInput.value,
        sensorId
      );
      if (result.status === 200) {
        const historyData = Forecast.fromApi(result.data);

        this.setHistoryData({ sensorId, historyData });
        return historyData;
      }

      return [];
    },
  },
});
