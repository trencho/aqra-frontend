import type { PollutantKey } from '@/types/domain';

/**
 * Each pollutant key mapped to itself, because the key *is* the value the API
 * uses. `satisfies Record<PollutantKey, PollutantKey>` checks both directions:
 * every declared pollutant is present, and none maps to something that is not a
 * pollutant key.
 */
export const Pollutants = {
  aqi: 'aqi',
  co: 'co',
  nh3: 'nh3',
  no: 'no',
  no2: 'no2',
  o3: 'o3',
  pm2_5: 'pm2_5',
  pm10: 'pm10',
  so2: 'so2',
} as const satisfies Record<PollutantKey, PollutantKey>;

/**
 * Display forms for chart labels and select options.
 *
 * The explicit Record annotation replaces what three tests in
 * __tests__/pollutants.spec.js were checking by hand -- that the map covers
 * every pollutant and carries no extras. The tests stay (they also assert the
 * conventional spellings), but a missing entry is now a compile error rather
 * than an `undefined` chart label at runtime.
 */
export const PollutantsLabels: Record<PollutantKey, string> = {
  aqi: 'AQI',
  co: 'CO',
  nh3: 'NH3',
  no: 'NO',
  no2: 'NO2',
  o3: 'O3',
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  so2: 'SO2',
};

/**
 * Divisor turning a raw reading into a 0..1 heatmap intensity.
 *
 * A missing entry here divides by undefined and yields NaN intensity, which
 * renders as an empty heat layer rather than an error -- exactly the kind of
 * silent failure the Record annotation now prevents.
 */
export const PollutantRatio: Record<PollutantKey, number> = {
  aqi: 30,
  co: 50,
  nh3: 1,
  no: 1,
  no2: 1000,
  o3: 800,
  pm2_5: 800,
  pm10: 1200,
  so2: 1250,
};
