import type { AxiosResponse } from 'axios';

import type {
  ApiCity,
  ApiForecast,
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

//countries
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

//pollutants
async function getDataForAllAvailablePollutantsBySensorId(
  cityName: PathParam,
  sensorId: PathParam
): Promise<AxiosResponse<ApiPollutant[]>> {
  return axios.get(`/cities/${cityName}/sensors/${sensorId}/pollutants/`);
}

export const aqra = {
  getDataForAllCities,
  getForecastBySpecificCoordinates,
  getForecastForSpecificSensor,
  getAvailableSensorsForCity,
  getDataForHistoricalPollution,
  getDataForAllAvailablePollutantsBySensorId,
};
