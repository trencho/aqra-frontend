import { describe, expect, it } from 'vitest';

import { present } from '@/__tests__/support/expect';
import type { ApiCity } from '@/types/api';

import { City } from '../city';

// Typed as ApiCity rather than left to inference, so the fixture is checked
// against the payload shape the mapper declares. `longitute` is the upstream
// misspelling and is deliberate -- see the test below and ApiCoordinates.
const apiCity: ApiCity = {
  siteUrl: 'https://skopje.pulse.eco',
  cityName: 'skopje',
  siteName: 'Skopje',
  siteTitle: 'Skopje pulse',
  countryCode: 'MK',
  countryName: 'North Macedonia',
  initialZoomLevel: 12,
  cityLocation: { latitude: '41.9981', longitute: '21.4254' },
  cityBorderPoints: [
    { latitude: '42.0', longitute: '21.3' },
    { latitude: '41.9', longitute: '21.5' },
  ],
};

describe('City.fromApi', () => {
  it('returns null for a missing city rather than throwing', () => {
    expect(City.fromApi(null)).toBeNull();
    expect(City.fromApi(undefined)).toBeNull();
  });

  it('carries the scalar fields through unchanged', () => {
    const city = present(City.fromApi(apiCity));

    expect(city).toBeInstanceOf(City);
    expect(city.cityName).toBe('skopje');
    expect(city.siteName).toBe('Skopje');
    expect(city.siteTitle).toBe('Skopje pulse');
    expect(city.siteUrl).toBe('https://skopje.pulse.eco');
    expect(city.countryCode).toBe('MK');
    expect(city.countryName).toBe('North Macedonia');
    expect(city.initialZoomLevel).toBe(12);
  });

  it('maps cityLocation to a [latitude, longitude] pair', () => {
    expect(present(City.fromApi(apiCity)).position).toEqual([
      '41.9981',
      '21.4254',
    ]);
  });

  // Guards a deliberate misspelling. The upstream API sends `longitute`, not
  // `longitude`, and city.ts reads it verbatim. "Correcting" the spelling
  // silently yields [lat, undefined] for every city, so this test exists to
  // make that break loudly.
  //
  // The cast is now part of the guard: ApiCoordinates declares `longitute`, so
  // the correctly-spelled object below is not a valid payload at all -- which is
  // exactly the point. The compiler rejecting it is a second line of defence
  // behind this assertion.
  it('reads the upstream misspelling `longitute`, not `longitude`', () => {
    const correctlySpelled = {
      ...apiCity,
      cityLocation: { latitude: '41.9981', longitude: '21.4254' },
    } as ApiCity;

    expect(present(City.fromApi(correctlySpelled)).position).toEqual([
      '41.9981',
      undefined,
    ]);
  });

  it('returns an empty position when cityLocation is absent', () => {
    expect(
      present(City.fromApi({ ...apiCity, cityLocation: null })).position
    ).toEqual([]);
  });

  it('maps every border point', () => {
    expect(present(City.fromApi(apiCity)).borders).toEqual([
      ['42.0', '21.3'],
      ['41.9', '21.5'],
    ]);
  });

  it('returns empty borders when cityBorderPoints is absent', () => {
    expect(
      present(City.fromApi({ ...apiCity, cityBorderPoints: null })).borders
    ).toEqual([]);
  });
});
