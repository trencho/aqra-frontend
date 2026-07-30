import { describe, expect,it } from 'vitest';

import { Pollutant } from '../pollutant';

describe('Pollutant.fromApi', () => {
  it('returns null for a missing pollutant rather than throwing', () => {
    expect(Pollutant.fromApi(null)).toBeNull();
    expect(Pollutant.fromApi(undefined)).toBeNull();
  });

  it('maps name and value onto a Pollutant', () => {
    const pollutant = Pollutant.fromApi({ name: 'pm10', value: 42 });

    expect(pollutant).toBeInstanceOf(Pollutant);
    expect(pollutant.name).toBe('pm10');
    expect(pollutant.value).toBe(42);
  });

  it('ignores fields outside the config shape', () => {
    const pollutant = Pollutant.fromApi({
      name: 'co',
      value: 7,
      unexpected: 'ignored',
    });

    expect(pollutant.unexpected).toBeUndefined();
    expect(Object.keys(pollutant).sort()).toEqual(['name', 'value']);
  });

  it('preserves a zero value rather than coercing it away', () => {
    // 0 is a legitimate reading; a truthiness check here would lose it.
    expect(Pollutant.fromApi({ name: 'no2', value: 0 }).value).toBe(0);
  });
});
