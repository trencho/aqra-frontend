import { describe, it, expect } from 'vitest';
import { transformRequestOptions, axios } from '../axios';

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
    expect(
      transformRequestOptions({ a: undefined, b: '', c: 0 })
    ).toBe('b=&c=0');
  });
});

describe('axios module configuration', () => {
  it('points at the AQRA API by default', () => {
    expect(axios.defaults.baseURL).toBe('https://aqra.feit.ukim.edu.mk/api/v1');
  });

  it('wires transformRequestOptions in as the params serializer', () => {
    expect(axios.defaults.paramsSerializer).toBe(transformRequestOptions);
  });

  it('accepts any content type', () => {
    expect(axios.defaults.headers.common.Accept).toBe('*');
  });

  // CHARACTERIZATION TESTS -- these pin today's behaviour so Phase 8 changes
  // are deliberate rather than accidental. They are not endorsements.
  //
  // The module exports the GLOBAL axios singleton and mutates it in place
  // rather than using Axios.create(), so this configuration leaks to every
  // other consumer of axios in the process.
  it('currently has NO timeout — a hung request hangs forever (see Phase 8)', () => {
    expect(axios.defaults.timeout).toBeFalsy();
  });

  it('currently carries an unused lodash.set monkey-patch (see Phase 8)', () => {
    expect(typeof axios.set).toBe('function');
  });
});
