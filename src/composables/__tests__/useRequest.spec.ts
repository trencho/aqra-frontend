import type { AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { axiosResponse } from '@/__tests__/support/expect';

import type { RequestState } from '../useRequest';
import {
  createRequestState,
  hasError,
  isLoading,
  useRequest,
} from '../useRequest';

// Driven against a plain object, never a store. That is the whole point of the
// file: the request plumbing used to be three actions and two getters welded to
// `this` inside a 598-line Pinia store, and there was no way to exercise it
// without one. Everything below runs on `{ error: null, pending: 0 }`.
//
// The store's own specs still drive the same behaviour through
// store.request(...) -- these do not replace them, they prove the extraction is
// real rather than a re-export.

describe('createRequestState', () => {
  it('starts with no error and nothing in flight', () => {
    expect(createRequestState()).toEqual({ error: null, pending: 0 });
  });

  it('returns a fresh object each call, so two stores cannot share a counter', () => {
    const a = createRequestState();
    const b = createRequestState();

    a.pending = 5;

    expect(b.pending).toBe(0);
  });
});

describe('useRequest().run', () => {
  const state = (): RequestState => createRequestState();

  it('unwraps a 200 and clears any previous error', async () => {
    const s = state();
    s.error = 'stale';

    const result = await useRequest(s).run(() =>
      Promise.resolve(axiosResponse(['a'], 200))
    );

    expect(result).toEqual({ ok: true, data: ['a'] });
    expect(s.error).toBeNull();
  });

  it('reports a non-200 by status rather than throwing', async () => {
    const s = state();

    const result = await useRequest(s).run(() =>
      Promise.resolve(axiosResponse(null, 503))
    );

    expect(result).toEqual({ ok: false, data: null });
    expect(s.error).toContain('503');
  });

  // axios rejects on 4xx/5xx rather than resolving, which is why a
  // `status === 200` check alone never saw a failure.
  it('converts a rejection into state instead of an unhandled rejection', async () => {
    const s = state();

    const result = await useRequest(s).run(() =>
      Promise.reject(new Error('Network Error'))
    );

    expect(result).toEqual({ ok: false, data: null });
    expect(s.error).toBe('Network Error');
  });

  it('counts concurrent calls rather than holding a boolean', async () => {
    const s = state();
    const release: Array<() => void> = [];
    const blocked = () =>
      useRequest(s).run(
        () =>
          new Promise<AxiosResponse<never[]>>((resolve) => {
            release.push(() => resolve(axiosResponse([], 200)));
          })
      );

    const first = blocked();
    const second = blocked();
    expect(s.pending).toBe(2);
    expect(isLoading(s)).toBe(true);

    release[0]!();
    await first;
    // One still in flight: a boolean flag would have reported idle here, and
    // the progress bar would vanish while a request was still running.
    expect(isLoading(s)).toBe(true);

    release[1]!();
    await second;
    expect(s.pending).toBe(0);
    expect(isLoading(s)).toBe(false);
  });

  // The decrement is in a `finally`. Without it a failing request leaks a count
  // and the progress bar never goes away -- and since the failure path also
  // sets an error, the symptom would look like an error-handling bug.
  it('decrements the in-flight count on the failure path too', async () => {
    const s = state();

    await useRequest(s).run(() => Promise.reject(new Error('boom')));

    expect(s.pending).toBe(0);
    expect(isLoading(s)).toBe(false);
  });
});

describe('useRequest().clearError', () => {
  it('clears the error without touching the in-flight count', () => {
    const s: RequestState = { error: 'Network Error', pending: 2 };

    useRequest(s).clearError();

    expect(s.error).toBeNull();
    expect(s.pending).toBe(2);
  });
});

describe('predicates', () => {
  // `error !== null`, not truthiness. Nothing in src/ can put '' here today --
  // errorMessage() substitutes its fallback for an empty message precisely so
  // the snackbar never opens blank -- so this is asserting the predicate's own
  // contract rather than a reachable path. Worth pinning because the two differ
  // only for '' and 0, and a later writer reaching for `!!state.error` would
  // pass every other test in this file.
  it('hasError treats an empty message as an error, not as absence', () => {
    expect(hasError({ error: '', pending: 0 })).toBe(true);
    expect(hasError({ error: null, pending: 0 })).toBe(false);
  });

  it('isLoading reads the count', () => {
    expect(isLoading({ error: null, pending: 0 })).toBe(false);
    expect(isLoading({ error: null, pending: 1 })).toBe(true);
  });
});
