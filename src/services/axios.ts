import Axios from 'axios';
import qs from 'qs';

const DEFAULT_API_URL = 'https://aqra.feit.ukim.edu.mk/api/v1';

/** Requests are abandoned after this long rather than hanging forever. */
export const REQUEST_TIMEOUT_MS = 15000;

export function transformRequestOptions(
  params: Record<string, unknown>
): string {
  return qs.stringify(params, { encode: false, indices: false });
}

export interface ApiErrorOptions {
  // `| undefined` alongside the `?` so that passing a possibly-absent value
  // through is legal under exactOptionalPropertyTypes. Without it, callers have
  // to write `?? null` at every call site, which adds an uncovered branch each
  // time -- the destructuring defaults below already do that job once.
  status?: number | null | undefined;
  url?: string | null | undefined;
  cause?: unknown;
}

/**
 * A single error type for everything the API layer can fail with, so callers
 * do not have to distinguish an axios rejection from a bad status.
 */
export class ApiError extends Error {
  status: number | null;
  url: string | null;

  constructor(
    message: string,
    { status = null, url = null, cause = null }: ApiErrorOptions = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    // Not declared as a field: Error already carries an optional `cause` from
    // the ES2022 lib, and re-declaring it here would emit a field initialiser
    // under useDefineForClassFields and shadow it.
    this.cause = cause;
  }

  /** True for timeouts and connection failures, i.e. worth retrying. */
  get isNetworkError(): boolean {
    return this.status === null;
  }
}

/**
 * The parts of an axios rejection this module probes.
 *
 * Not imported from axios: the rejected handler is also called directly by
 * axios.spec.js with bare object literals like `{}` and
 * `{ code: 'ECONNABORTED', config: { url } }`, which are not AxiosError
 * instances. This describes the duck-typed shape actually relied on.
 */
interface RejectionLike {
  message?: string;
  code?: string;
  config?: { url?: string };
  response?: { status?: number };
}

function toApiError(error: unknown): ApiError {
  // One cast, at the boundary where axios hands us `unknown`. The optional
  // chaining below mirrors the .js version's `error?.…` exactly, rather than
  // defaulting to `{}` first: same protection, but no extra branch for the
  // coverage gate to leave unexercised.
  const rejection = error as RejectionLike | null | undefined;
  const url = rejection?.config?.url ?? null;

  if (rejection?.response) {
    return new ApiError(
      `Request to ${url} failed with status ${rejection.response.status}`,
      { status: rejection.response.status, url, cause: error }
    );
  }

  if (rejection?.code === 'ECONNABORTED') {
    return new ApiError(
      `Request to ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      { url, cause: error }
    );
  }

  return new ApiError(rejection?.message || 'Network request failed', {
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
  (error: unknown) => Promise.reject(toApiError(error))
);
