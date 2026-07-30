import type { AxiosResponse } from 'axios';
import { expect } from 'vitest';

/**
 * Test-only narrowing helpers.
 *
 * Not a `.spec` file, so the vitest include glob
 * ('src/**\/__tests__/**\/*.spec.{js,ts}') does not collect it, and it sits
 * under __tests__ so the coverage config's blanket exclude covers it too.
 *
 * These exist because converting the specs to TypeScript surfaced two patterns
 * that a non-null assertion would have silenced rather than checked.
 */

/**
 * Narrow away null/undefined, failing the test if the value is actually absent.
 *
 * Every `fromApi` mapper returns `T | null`, so any spec that maps a fixture and
 * then reads a field needs this. Writing `!` instead would type-check and turn a
 * null regression into a confusing "cannot read property of undefined" thrown
 * from the middle of an assertion; this fails at the point the value was
 * supposed to exist, and says so.
 */
export function present<T>(value: T | null | undefined): T {
  expect(value, 'expected a value to be present').not.toBeNull();
  expect(value, 'expected a value to be present').not.toBeUndefined();

  return value as T;
}

/**
 * Read an array element, failing the test if it is missing.
 *
 * `noUncheckedIndexedAccess` types every index read as `T | undefined`, which is
 * the honest description -- a fixture that silently produced fewer elements than
 * the test assumes is exactly the kind of drift worth catching rather than
 * asserting away.
 */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  expect(item, `expected an element at index ${index}`).toBeDefined();

  return item as T;
}

/**
 * A minimal axios response, for mocking an endpoint's resolution.
 *
 * The store reads only `status` and `data`, so building the other dozen fields
 * of AxiosResponse -- headers, config, request -- would be inventing values no
 * assertion looks at. One cast here beats one per `mockResolvedValue` call.
 *
 * `data` is deliberately loose: several tests resolve with a null or malformed
 * body specifically to check the store's error handling.
 */
export function axiosResponse<T>(data: unknown, status = 200): AxiosResponse<T> {
  return { status, data } as AxiosResponse<T>;
}

/**
 * The first argument of the nth emission of `event`, failing if it never fired.
 *
 * `wrapper.emitted('x')[0][0].value` was previously unchecked in both
 * directions: `emitted` is `unknown[][] | undefined`, so neither the emission
 * nor the payload's shape was verified, and a component that stopped emitting
 * failed with a TypeError rather than a useful message. Naming the payload type
 * at the call site fixes both.
 */
export function emittedPayload<T>(
  wrapper: { emitted(event: string): unknown[][] | undefined },
  event: string,
  index = 0
): T {
  const emissions = wrapper.emitted(event);
  expect(emissions, `expected the component to emit "${event}"`).toBeTruthy();

  return at(at(emissions as unknown[][], index), 0) as T;
}
