import type { AxiosResponse } from 'axios';

import { errorMessage } from '@/utils/errors';

/**
 * The request-plumbing slice of a store's state.
 *
 * Spread into `state()` rather than nested under a `request` key, because
 * `store.error`, `store.pending`, `store.isLoading` and `store.hasError` are
 * the names HomePage.vue binds to and error-state.spec.ts asserts on. Nesting
 * would have been tidier to write and a rename for every consumer.
 */
export interface RequestState {
  /** Last request failure, for display. Null when the last attempt succeeded. */
  error: string | null;
  /** Number of requests currently in flight. */
  pending: number;
}

/**
 * A discriminated union so `if (!ok) return []` narrows `data` to non-null in
 * the branch that follows. A plain `{ ok: boolean; data: T | null }` would leave
 * every caller asserting.
 */
export type RequestResult<T> = { ok: true; data: T } | { ok: false; data: null };

export function createRequestState(): RequestState {
  return { error: null, pending: 0 };
}

/**
 * Bind the request helpers to a piece of state.
 *
 * State is a parameter rather than reactive refs owned in here, which is the
 * one design decision in this file. A `use*` composable holding its own
 * `ref(0)` would put `pending` outside Pinia, where `$state`, `$reset`,
 * `$patch`, the devtools timeline and `createTestingPinia`'s `initialState`
 * cannot see it -- and module-level refs would additionally leak counts between
 * specs, which is the kind of shared mutable state a suite discovers late and
 * at random. Pinia owns the state; this owns the behaviour.
 */
export function useRequest(state: RequestState) {
  return {
    /**
     * Run an API call, converting every failure into store state instead of an
     * unhandled rejection.
     *
     * Every action used to test `result.status === 200` and do nothing
     * otherwise -- but axios rejects on 4xx/5xx rather than resolving, so that
     * check never saw a failure and the rejection escaped the action entirely.
     * There was no try/catch anywhere in src/, so a single failed request left
     * the UI stuck with no feedback.
     */
    async run<T>(
      call: () => Promise<AxiosResponse<T>>
    ): Promise<RequestResult<T>> {
      state.pending += 1;
      try {
        const result = await call();

        if (result?.status === 200) {
          state.error = null;
          return { ok: true, data: result.data };
        }

        state.error = `Request failed with status ${result?.status ?? 'unknown'}`;
        return { ok: false, data: null };
      } catch (cause) {
        // `cause` is typed unknown under strict (useUnknownInCatchVariables),
        // so the narrowing lives in one shared helper rather than here.
        state.error = errorMessage(cause, 'Request failed');
        return { ok: false, data: null };
      } finally {
        // In `finally`, so a throw from the success branch still decrements.
        state.pending -= 1;
      }
    },

    clearError() {
      state.error = null;
    },
  };
}

export const isLoading = (state: RequestState): boolean => state.pending > 0;
export const hasError = (state: RequestState): boolean => state.error !== null;
