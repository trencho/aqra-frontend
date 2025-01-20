import qs from 'qs';
import Axios from 'axios';
import set from 'lodash/set';

export function transformRequestOptions(params) {
    return qs.stringify(params, {encode: false, indices: false});
}

export const axios = Axios;

console.log(process.env.NODE_ENV);
console.log(process.env.VUE_APP_AQRA_API_URL);
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? process.env.VUE_APP_AQRA_API_URL || 'https://aqra.feit.ukim.edu.mk/api/v1' : 'https://aqra.feit.ukim.edu.mk/api/v1';

axios.defaults.headers.common.Accept = '*';

axios.defaults.paramsSerializer = transformRequestOptions;

axios.set = function (path, value) {
    set(axios, path, value);
};
