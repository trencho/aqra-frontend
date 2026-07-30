import Axios from 'axios';
import qs from 'qs';

const DEFAULT_API_URL = 'https://aqra.feit.ukim.edu.mk/api/v1';

/** Requests are abandoned after this long rather than hanging forever. */
export const REQUEST_TIMEOUT_MS = 15000;

export function transformRequestOptions(params) {
  return qs.stringify(params, { encode: false, indices: false });
}

/**
 * A single error type for everything the API layer can fail with, so callers
 * do not have to distinguish an axios rejection from a bad status.
 */
export class ApiError extends Error {
  constructor(message, { status = null, url = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.cause = cause;
  }

  /** True for timeouts and connection failures, i.e. worth retrying. */
  get isNetworkError() {
    return this.status === null;
  }
}

function toApiError(error) {
  const url = error?.config?.url ?? null;

  if (error?.response) {
    return new ApiError(
      `Request to ${url} failed with status ${error.response.status}`,
      { status: error.response.status, url, cause: error }
    );
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiError(
      `Request to ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      { url, cause: error }
    );
  }

  return new ApiError(error?.message || 'Network request failed', {
    url,
    cause: error,
  });
}

/**
 * A dedicated instance rather than the global axios singleton.
 *
 * This module used to `export const axios = Axios` and then mutate
 * `Axios.defaults` in place, so its configuration leaked to every other
 * consumer of axios in the process.
 *
 * Vite exposes env vars on import.meta.env, and only those prefixed VITE_.
 * See .env.example.
 */
export const axios = Axios.create({
  baseURL: import.meta.env.VITE_AQRA_API_URL || DEFAULT_API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: '*' },
  paramsSerializer: { serialize: transformRequestOptions },
});

// One place where every failure becomes an ApiError. Without this each caller
// would have to unpick axios's own error shape, which is why none of them
// used to bother.
axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);
