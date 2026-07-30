import { describe, expect, it } from 'vitest';

import { present } from '@/__tests__/support/expect';
import type { ApiPollutant } from '@/types/api';

import { Pollutant } from '../pollutant';

describe('Pollutant.fromApi', () => {
  it('returns null for a missing pollutant rather than throwing', () => {
    expect(Pollutant.fromApi(null)).toBeNull();
    expect(Pollutant.fromApi(undefined)).toBeNull();
  });

  it('maps name and value onto a Pollutant', () => {
    const pollutant = present(Pollutant.fromApi({ name: 'pm10', value: 42 }));

    expect(pollutant).toBeInstanceOf(Pollutant);
    expect(pollutant.name).toBe('pm10');
    expect(pollutant.value).toBe(42);
  });

  it('ignores fields outside the config shape', () => {
    // Cast because the point of this test is to hand fromApi something wider
    // than ApiPollutant declares -- the upstream payload can carry fields we do
    // not model, and the mapper must drop them.
    const pollutant = present(
      Pollutant.fromApi({
        name: 'co',
        value: 7,
        unexpected: 'ignored',
      } as ApiPollutant)
    );

    expect(
      (pollutant as unknown as Record<string, unknown>).unexpected
    ).toBeUndefined();
    expect(Object.keys(pollutant).sort()).toEqual(['name', 'value']);
  });

  it('preserves a zero value rather than coercing it away', () => {
    // 0 is a legitimate reading; a truthiness check here would lose it.
    expect(present(Pollutant.fromApi({ name: 'no2', value: 0 })).value).toBe(0);
  });
});
