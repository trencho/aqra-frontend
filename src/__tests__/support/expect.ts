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
