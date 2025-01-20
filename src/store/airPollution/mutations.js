import {Pollutants, PollutantsLabels} from '@/constants/pollutants';
import {types} from './types';

export const mutations = {
  [types.SET_TAB_ID](state, id) {
    state.tabId = id;
  },
  [types.SET_DRAWER](state, drawer) {
    state.drawer = drawer;
  },
  [types.SET_CITIES](state, cities) {
    state.cities = mapList(cities, 'cityName');
  },
  [types.SET_SENSOR_INPUT_OPTIONS](state, options) {
    state.sensorInput.value = null;
    state.pollutantInput.value = null;
    state.sensorInput.items = (options || []).map(o => ({
      label: o.description,
      value: o.sensorId
    }));
  },
  [types.SET_POLLUTANT_INPUT_OPTIONS](state, options) {
    state.pollutantInput.value = null;
    state.pollutantInput.items = (options || []).map(o => ({
      label: o.name,
      value: o.value
    }));
  },
  [types.SET_VALUE](state, {input, value}) {
    input.value = value;
  },
  [types.SET_SENSORS_BY_CITY](state, {cityName, sensors}) {
    if (!state.cities) {
      return;
    }
    state.cities[cityName].sensors = mapList(sensors, 'sensorId');
  },
  [types.SET_FORECAST_FOR_SENSOR](state, {sensorId, forecast, cityName}) {
    if (!state.cities[cityName].sensors) {
      return;
    }
    const selected = state.cities[cityName].sensors?.[sensorId];
    selected.forecast = forecast;
  },
  [types.SET_FORECAST_FOR_CITY](state, {forecast, cityName}) {
      state.cities[cityName].forecast = forecast;
  },
  [types.SET_POLLUTANTS_FOR_SENSOR](state, {sensorId, pollutants}) {
    state.pollutantsBySensorId = {
      ...state.pollutantsBySensorId,
      [sensorId]: pollutants
    };
  },
  [types.SET_SHOW_ALL_CITIES](state, value) {
    state.showForAllSensorsInput.value = false;
    state.nameInput.hidden = value;
    state.sensorInput.hidden = value;
    state.nameInput.value = value ? null : state.nameInput.value;
    state.sensorInput.value = value ? null : state.sensorInput.value;
    state.pollutantInput.items = value ? mapPollutants() : [];
    state.pollutantInput.value = null;
  },
  [types.SET_SHOW_ALL_SENSORS](state, value) {
    state.showForAllCitiesInput.value = false;
    state.nameInput.hidden = value;
    state.sensorInput.hidden = value;
    state.nameInput.value = value ? null : state.nameInput.value;
    state.sensorInput.value = value ? null : state.sensorInput.value;
    state.pollutantInput.items = value ? mapPollutants() : [];
    state.pollutantInput.value = null;
  },
  [types.SET_HISTORY_DATA](state, {sensorId, historyData}) {
    state.historyData = {
      ...state.historyData,
      [sensorId]: historyData
    };
  },
  [types.SET_STATISTIC_FILTERS](state) {
    state.nameInput = {
      id: 'name',
      label: 'common.cityName',
      value: null,
      hidden: false,
      items: (state.cities ? Object.values(state.cities) : []).map(c => ({
          label: c.siteName,
          value: c.cityName
      }))
    };
    state.sensorInput = {
      id: 'sensor',
      label: 'common.sensors',
      value: null,
      hidden: false,
      items: []
    };
    state.pollutantInput = {
      id: 'pollutant',
      label: 'common.pollutants',
      value: null,
      items: []
    };
  },

  [types.SET_FILTERS](state) {
    state.nameInput = {
      id: 'name',
      label: 'common.cityName',
      value: null,
      hidden: false,
      items: (state.cities ? Object.values(state.cities) : []).map(c => ({
          label: c.siteName,
          value: c.cityName
      }))
    };
    state.sensorInput = {
      id: 'sensor',
      label: 'common.sensors',
      value: null,
      hidden: false,
      items: []
    };
    state.pollutantInput = {
      id: 'pollutant',
      label: 'common.pollutants',
      value: null,
      items: []
    };
    state.showForAllCitiesInput = {
      id: 'showForAllCities',
      label: 'common.showForecastForAllCities',
      value: false,
    };
    state.showCityBoundariesInput = {
      id: 'showCityBoundaries',
      label: 'common.showCityBoundaries',
      value: false,
    };
    state.showCityMarkersInput = {
      id: 'showCityMarkers',
      label: 'common.showCityMarkers',
      value: true,
    };
    state.showForAllSensorsInput = {
      id: 'showForAllSensors',
      label: 'common.showForecastForAllSensors',
      value: false,
    };
    state.showSensorMarkersInput = {
      id: 'showSensorMarkers',
      label: 'common.showSensorMarkers',
      value: false,
    };
  }
};

function mapList(list, entity) {
  const map = {};
  list.forEach(i => map[i[entity]] = i);
  return map;
}

function mapPollutants() {
  return Object.values(Pollutants).map(p => ({
      label: PollutantsLabels[p],
      value: p
  }));
}