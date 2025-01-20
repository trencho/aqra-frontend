import {axios} from './axios';

//cities
async function getDataForAllCities() {
    return axios.get('/cities/')
}

async function getDataForCity(city) {
    return axios.get(`/cities/${city}/`)
}

//countries
async function getDataForAllCountries() {
    return axios.get('/countries/')
}

async function getDataForCountry(country) {
    return axios.get(`/countries/${country}/`)
}

//forcast
async function getForecastBySpecificCoordinates(latitude, longitude) {
    return axios.get(`/coordinates/${latitude},${longitude}/forecast/`)
}

async function getForecastForSpecificSensor(cityName, sensorId) {
    return axios.get(`/cities/${cityName}/sensors/${sensorId}/forecast/`)
}

//sensors
async function getAvailableSensorsForCity(cityName) {
    return axios.get(`/cities/${cityName}/sensors/`)
}

async function getDataForSpecificSensorByCityName(cityName, sensorId) {
    return axios.get(`/cities/${cityName}/sensors/${sensorId}/`)
}

//history
async function getDataForHistoricalPollution(cityName, sensorId, dataType = 'pollution') {
    return axios.get(`/cities/${cityName}/sensors/${sensorId}/history/${dataType}/`)
}

async function getDataForSpecificSensorByCoordinates(latitude, longitude, dataType = 'pollution') {
    return axios.get(`/coordinates/${latitude},${longitude}/history/${dataType}/`)
}

//pollutants
async function getDataForAllAvailablePollutantsBySensorId(cityName, sensorId) {
    return axios.get(`/cities/${cityName}/sensors/${sensorId}/pollutants/`)
}

async function getDataForAllAvailablePollutantsByCoordinates(latitude, longitude) {
    return axios.get(`/coordinates/${latitude},${longitude}/pollutants/`)
}

export const aqra = {
    getDataForAllCities,
    getDataForCity,
    getDataForAllCountries,
    getDataForCountry,
    getForecastBySpecificCoordinates,
    getForecastForSpecificSensor,
    getAvailableSensorsForCity,
    getDataForSpecificSensorByCityName,
    getDataForHistoricalPollution,
    getDataForSpecificSensorByCoordinates,
    getDataForAllAvailablePollutantsBySensorId,
    getDataForAllAvailablePollutantsByCoordinates
};