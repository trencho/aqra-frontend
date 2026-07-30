import type { AxiosResponse } from 'axios';

import type {
  ApiCity,
  ApiForecast,
  ApiForecastDatum,
  ApiPollutant,
  ApiSensor,
} from '@/types/api';

import { axios } from './axios';

/**
 * A value interpolated into a request path.
 *
 * Nullable on purpose. The callers are the store's filter actions, whose select
 * state is `string | null` before anything is chosen, and coordinates come from
 * a Position whose elements are `string | undefined`. Narrowing this to `string`
 * would only push the same nullability into a cast at every call site.
 */
type PathParam = string | number | null | undefined;

//cities
async function getDataForAllCities(): Promise<AxiosResponse<ApiCity[]>> {
  return axios.get('/cities/');
}

async function getDataForCity(
  city: PathParam
): Promise<AxiosResponse<ApiCity>> {
  return axios.get(`/cities/${city}/`);
}

//countries
async function getDataForAllCountries(): Promise<AxiosResponse<unknown>> {
  return axios.get('/countries/');
}

async function getDataForCountry(
  country: PathParam
): Promise<AxiosResponse<unknown>> {
  return axios.get(`/countries/${country}/`);
}

//forecast
async function getForecastBySpecificCoordinates(
  latitude: PathParam,
  longitude: PathParam
): Promise<AxiosResponse<ApiForecast>> {
  return axios.get(`/cities/coordinates/${latitude},${longitude}/forecast/`);
}

async function getForecastForSpecificSensor(
  cityName: PathParam,
  sensorId: PathParam
): Promise<AxiosResponse<ApiForecast>> {
  return axios.get(`/cities/${cityName}/sensors/${sensorId}/forecast/`);
}

//sensors
async function getAvailableSensorsForCity(
  cityName: PathParam
): Promise<AxiosResponse<ApiSensor[]>> {
  return axios.get(`/cities/${cityName}/sensors/`);
}

async function getDataForSpecificSensorByCityName(
  cityName: PathParam,
  sensorId: PathParam
): Promise<AxiosResponse<ApiSensor>> {
  return axios.get(`/cities/${cityName}/sensors/${sensorId}/`);
}

//history
async function getDataForHistoricalPollution(
  cityName: PathParam,
  sensorId: PathParam,
  dataType = 'pollution'
): Promise<AxiosResponse<ApiForecast>> {
  return axios.get(
    `/cities/${cityName}/sensors/${sensorId}/history/${dataType}/`
  );
}

async function getDataForSpecificSensorByCoordinates(
  latitude: PathParam,
  longitude: PathParam,
  dataType = 'pollution'
): Promise<AxiosResponse<ApiForecastDatum[]>> {
  return axios.get(
    `/coordinates/${latitude},${longitude}/history/${dataType}/`
  );
}

//pollutants
async function getDataForAllAvailablePollutantsBySensorId(
  cityName: PathParam,
  sensorId: PathParam
): Promise<AxiosResponse<ApiPollutant[]>> {
  return axios.get(`/cities/${cityName}/sensors/${sensorId}/pollutants/`);
}

async function getDataForAllAvailablePollutantsByCoordinates(
  latitude: PathParam,
  longitude: PathParam
): Promise<AxiosResponse<ApiPollutant[]>> {
  return axios.get(`/coordinates/${latitude},${longitude}/pollutants/`);
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
  getDataForAllAvailablePollutantsByCoordinates,
};
