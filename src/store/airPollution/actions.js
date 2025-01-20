import {Sensor} from '@/classes/sensors';
import {City} from '@/classes/city';
import {aqra} from '@/services/api';
import {types} from './types';
import {Pollutant} from '@/classes/pollutant';
import {Forecast} from '@/classes/forecast';

export const actions = Object.freeze({
    setDrawer,
    changeTab,
    getCities,
    setValue,
    initMapPage,
    initHomePage,
    initStatisticPage,
    getSensorsForAllCities,
    getSensorsByCityName,
    getForecastBySensorId,
    getForecastForAllSensors,
    getPollutantsBySensorId,
    getForecastForAllCities,
    getHistoryDataBySensorId,
    getForecastByCoordinatesForCity
});

async function initHomePage({dispatch}) {
    await dispatch('getCities');
}

async function setDrawer({commit}, drawer) {
    commit(types.SET_DRAWER, drawer);
}

async function initMapPage({commit}) {
    commit(types.SET_FILTERS);
}

async function initStatisticPage({commit}) {
    commit(types.SET_STATISTIC_FILTERS);
}

async function setValue({commit, dispatch, state}, config) {
    commit(types.SET_VALUE, config);

    switch (config.input.id) {
        case 'name': {
            const sensors = await dispatch('getSensorsByCityName', config.value);
            commit(types.SET_SENSOR_INPUT_OPTIONS, Object.values(sensors));
            break;
        }
        case 'sensor': {
            const pollutants = await dispatch('getPollutantsBySensorId', config.value);
            commit(types.SET_POLLUTANT_INPUT_OPTIONS, pollutants);
            await dispatch('getHistoryDataBySensorId', config.value)
            break;
        }
        case 'pollutant':
            if (!state.showForAllCitiesInput.value && !state.showForAllSensorsInput.value) {
                await dispatch('getForecastBySensorId', {
                    sensorId: state.sensorInput.value,
                    cityName: state.nameInput.value
                });
            }
            break;
        case 'showForAllCities': {
            commit(types.SET_SHOW_ALL_CITIES, config.value);
            await dispatch('getForecastForAllCities', state.sensorInput.value);
            break;
        }
        case 'showForAllSensors': {
            commit(types.SET_SHOW_ALL_SENSORS, config.value);
            await dispatch('getForecastForAllSensors', state.sensorInput.value);
            break;
        }
        case 'showSensorMarkers': {
            await dispatch('getSensorsForAllCities');
            break;
        }
    }
}

async function getForecastForAllSensors({dispatch, state}) {
    if (!state.cities) {
        return;
    }

    await dispatch('getSensorsForAllCities');
    await Promise.all(Object.values(state.cities)
        .map(c => Object.values(c.sensors || {})
            .map(s => dispatch('getForecastBySensorId', {sensorId: s.sensorId, cityName: c.cityName})))
        .flat());
}

async function getSensorsForAllCities({state, dispatch}) {
    if (!state.cities) {
        return;
    }

    await Promise.all(Object.values(state.cities).map(c => dispatch('getSensorsByCityName', c.cityName)));
}

async function getForecastForAllCities({state, dispatch}) {
    if (!state.cities) {
        return;
    }

    await Promise.all(Object.values(state.cities).map(c =>
        dispatch('getForecastByCoordinatesForCity', {position: c.position, cityName: c.cityName})).flat());
}

async function changeTab({commit, state}, id) {
    if (id !== state.tabId) {
        commit(types.SET_DRAWER, false);
    }
    commit(types.SET_TAB_ID, id);
}

async function getCities({state, commit}) {
    if (state.cities?.length) {
        return state.cities;
    }
    const result = await aqra.getDataForAllCities();

    if (result.status === 200) {
        const cities = result.data.map(City.fromApi);
        commit(types.SET_CITIES, cities);

        return cities;
    }

    return [];
}

async function getSensorsByCityName({commit, state}, cityName) {
    if (state.cities?.[cityName]?.sensors) {
        return state.cities?.[cityName].sensors;
    }
    const result = await aqra.getAvailableSensorsForCity(cityName);
    if (result.status === 200) {
        const sensors = result.data.map(Sensor.fromApi);
        commit(types.SET_SENSORS_BY_CITY, {
            sensors: result.data.map(Sensor.fromApi),
            cityName
        });
        return sensors;
    }

    return [];
}

async function getForecastByCoordinatesForCity({commit, state}, {position, cityName}) {
    const forecast = Object.values(state.cities).find(c => c.position === position)?.forecast;
    if (forecast) {
        return forecast;
    }
    const result = await aqra.getForecastBySpecificCoordinates(position[0], position[1]);
    if (result.status === 200) {
        const forecast = Forecast.fromApi(result.data);

        commit(types.SET_FORECAST_FOR_CITY, {forecast, cityName});
        return forecast;
    }

    return [];
}

async function getForecastBySensorId({commit, state}, {sensorId, cityName}) {
    const forecast = state.cities?.[cityName]?.sensors?.[sensorId]?.forecast;
    if (forecast) {
        return forecast;
    }
    const result = await aqra.getForecastForSpecificSensor(cityName, sensorId);
    if (result.status === 200) {
        const forecast = Forecast.fromApi(result.data);

        commit(types.SET_FORECAST_FOR_SENSOR, {sensorId, forecast, cityName});
        return forecast;
    }

    return [];
}

async function getPollutantsBySensorId({commit, state}, sensorId) {
    if (state.pollutantsBySensorId?.[sensorId]) {
        return state.pollutantsBySensorId?.[sensorId];
    }
    const result = await aqra.getDataForAllAvailablePollutantsBySensorId(state.nameInput.value, sensorId);
    if (result.status === 200) {
        const pollutants = result.data.map(Pollutant.fromApi);

        commit(types.SET_POLLUTANTS_FOR_SENSOR, {sensorId, pollutants});
        return pollutants;
    }

    return [];
}

async function getHistoryDataBySensorId({commit, state}, sensorId) {
    if (state.historyData?.[sensorId]) {
        return state.historyData?.[sensorId];
    }
    const result = await aqra.getDataForHistoricalPollution(state.nameInput.value, sensorId);
    if (result.status === 200) {
        const historyData = Forecast.fromApi(result.data);

        commit(types.SET_HISTORY_DATA, {sensorId, historyData});
        return historyData;
    }

    return [];
}