import qs from 'qs';
import Axios from 'axios';
import set from 'lodash/set';

const DEFAULT_API_URL = 'https://aqra.feit.ukim.edu.mk/api/v1';

export function transformRequestOptions(params) {
  return qs.stringify(params, { encode: false, indices: false });
}

export const axios = Axios;

// Vite exposes env vars on import.meta.env and only those prefixed VITE_.
// The old VUE_APP_AQRA_API_URL was read via process.env, which does not exist
// in the browser under Vite. See .env.example.
axios.defaults.baseURL = import.meta.env.VITE_AQRA_API_URL || DEFAULT_API_URL;

axios.defaults.headers.common.Accept = '*';

axios.defaults.paramsSerializer = transformRequestOptions;

axios.set = function (path, value) {
  set(axios, path, value);
};
