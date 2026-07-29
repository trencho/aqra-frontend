import { describe, it, expect } from 'vitest';
import {
  transformRequestOptions,
  axios,
  ApiError,
  REQUEST_TIMEOUT_MS,
} from '../axios';

describe('transformRequestOptions', () => {
  it('serializes a flat object as key=value pairs', () => {
    expect(transformRequestOptions({ city: 'skopje', sensor: 'sensor-1' })).toBe(
      'city=skopje&sensor=sensor-1'
    );
  });

  // encode: false is deliberate -- the API expects unescaped commas and colons
  // in coordinate and timestamp parameters. Turning encoding on would send
  // %2C and break them.
  it('does not percent-encode values', () => {
    expect(transformRequestOptions({ position: '41.9981,21.4254' })).toBe(
      'position=41.9981,21.4254'
    );
    expect(transformRequestOptions({ from: '2024-01-15T10:30:00Z' })).toBe(
      'from=2024-01-15T10:30:00Z'
    );
  });

  // indices: false is deliberate -- the API reads repeated bare keys, not
  // pollutants[0]=... which is qs's default.
  it('repeats the bare key for arrays instead of indexing them', () => {
    expect(transformRequestOptions({ pollutants: ['pm10', 'pm2_5'] })).toBe(
      'pollutants=pm10&pollutants=pm2_5'
    );
  });

  it('returns an empty string for an empty object', () => {
    expect(transformRequestOptions({})).toBe('');
  });

  it('omits undefined values but keeps empty strings and zero', () => {
    expect(transformRequestOptions({ a: undefined, b: '', c: 0 })).toBe('b=&c=0');
  });
});

describe('the axios instance', () => {
  it('points at the AQRA API by default', () => {
    expect(axios.defaults.baseURL).toBe('https://aqra.feit.ukim.edu.mk/api/v1');
  });

  it('wires transformRequestOptions in as the params serializer', () => {
    expect(axios.defaults.paramsSerializer.serialize).toBe(
      transformRequestOptions
    );
  });

  it('accepts any content type', () => {
    expect(axios.defaults.headers.Accept).toBe('*');
  });

  // Was previously absent, so a hung request hung forever.
  it('gives up on a hung request rather than waiting forever', () => {
    expect(axios.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
    expect(axios.defaults.timeout).toBeGreaterThan(0);
  });

  // The module used to `export const axios = Axios` and mutate Axios.defaults
  // in place, so its configuration leaked to every other consumer of axios in
  // the process.
  it('is a dedicated instance, not the global axios singleton', async () => {
    const { default: Axios } = await import('axios');

    expect(axios).not.toBe(Axios);
    expect(Axios.defaults.baseURL).toBeUndefined();
    expect(Axios.defaults.timeout).not.toBe(REQUEST_TIMEOUT_MS);
  });

  it('no longer carries the lodash.set monkey-patch', () => {
    expect(axios.set).toBeUndefined();
  });

  it('installs a response interceptor', () => {
    expect(axios.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});

describe('the response interceptor', () => {
  // Reach the handlers the interceptor registered, so the error-mapping logic
  // is exercised without issuing a real request.
  const handlers = () => axios.interceptors.response.handlers[0];

  const reject = (error) => handlers().rejected(error);

  it('passes a successful response straight through', () => {
    const response = { status: 200, data: { ok: true } };

    expect(handlers().fulfilled(response)).toBe(response);
  });

  it('maps an HTTP error response to an ApiError carrying the status', async () => {
    await expect(
      reject({
        response: { status: 404 },
        config: { url: '/cities/atlantis/' },
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      url: '/cities/atlantis/',
    });
  });

  it('describes a 5xx in the message', async () => {
    await expect(
      reject({ response: { status: 503 }, config: { url: '/cities/' } })
    ).rejects.toThrow(/503/);
  });

  it('maps a timeout to a network-flavoured ApiError', async () => {
    await expect(
      reject({ code: 'ECONNABORTED', config: { url: '/cities/' } })
    ).rejects.toMatchObject({ name: 'ApiError', status: null });

    await expect(
      reject({ code: 'ECONNABORTED', config: { url: '/cities/' } })
    ).rejects.toThrow(/timed out/);
  });

  it('maps a connection failure to an ApiError', async () => {
    await expect(
      reject({ message: 'Network Error', config: { url: '/cities/' } })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: null,
      message: 'Network Error',
    });
  });

  it('survives an error with no config at all', async () => {
    await expect(reject({})).rejects.toMatchObject({
      name: 'ApiError',
      url: null,
    });
  });

  it('preserves the original error as the cause', async () => {
    const original = { message: 'boom', config: { url: '/x/' } };

    await expect(reject(original)).rejects.toMatchObject({ cause: original });
  });

  it('flags statusless failures as network errors and HTTP ones as not', async () => {
    await expect(reject({ message: 'offline' })).rejects.toMatchObject({
      isNetworkError: true,
    });
    await expect(
      reject({ response: { status: 500 }, config: {} })
    ).rejects.toMatchObject({ isNetworkError: false });
  });
});

describe('ApiError', () => {
  it('carries the status and url of a failed request', () => {
    const error = new ApiError('boom', { status: 503, url: '/cities/' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(503);
    expect(error.url).toBe('/cities/');
  });

  it('reports a status-bearing failure as not a network error', () => {
    expect(new ApiError('boom', { status: 500 }).isNetworkError).toBe(false);
  });

  it('reports a statusless failure as a network error', () => {
    expect(new ApiError('offline').isNetworkError).toBe(true);
  });
});
