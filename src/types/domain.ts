/**
 * The vocabulary the app works in, after src/classes/ has mapped the raw
 * payloads in ./api.ts.
 *
 * Deliberately does not redeclare City, Sensor, Forecast or Pollutant: those
 * are classes, and a class is already a type. Duplicating them here would
 * create two definitions that can drift apart.
 */

/**
 * The nine pollutants the app tracks.
 *
 * Written as a literal union rather than derived with
 * `keyof typeof Pollutants`, so this file is the single source of truth and
 * src/constants/pollutants.ts is checked *against* it. Derived the other way
 * round, a constants map that dropped a key would silently narrow the union and
 * every lookup would keep type-checking.
 */
export type PollutantKey =
  | 'aqi'
  | 'co'
  | 'nh3'
  | 'no'
  | 'no2'
  | 'o3'
  | 'pm2_5'
  | 'pm10'
  | 'so2';

/** The three heatmap layer strategies, dispatched through CreateLayer. */
export type LayerKind = 'AllCities' | 'AllSensors' | 'SelectedSensor';

/**
 * A [latitude, longitude] pair -- as **strings**.
 *
 * This looks wrong and is not. The API sends city and border coordinates as
 * strings, sensor positions as a comma-separated string, and forecast
 * coordinates as numbers that forecast.ts stringifies. All three therefore
 * arrive here as strings, and the specs assert exactly that.
 *
 * Leaflet's own types want numbers. Rather than change what the mappers
 * produce -- which would rewrite assertions in three spec files and alter
 * documented behaviour -- the string-to-number conversion happens once, at the
 * Leaflet boundary, in src/utils/createMap.ts. Leaflet has always coerced these
 * with a unary `+` internally; doing it ourselves just makes it visible.
 *
 * `undefined` is a real possible element, not paranoia: when the upstream
 * `longitute` misspelling is absent, City.fromApi yields `[lat, undefined]`,
 * and there is a test pinning that.
 *
 * Empty when the source coordinates were missing entirely.
 */
export type Position = Array<string | undefined>;

/**
 * One measurement row, after mapping.
 *
 * `time` is a formatted 'DD/MM/YYYY HH:mm' UTC string here, not the unix
 * seconds that ApiForecastDatum carries -- that substitution is the whole job
 * of Forecast.fromApi's mapData.
 */
export interface ForecastDatum extends Partial<Record<PollutantKey, number>> {
  time: string;
}

/** An option in one of the filter selects. */
export interface SelectOption {
  label: string;
  value: string | null;
}

/**
 * A select-style filter (city name, sensor, pollutant).
 *
 * `hidden` is optional because pollutantInput is built without it while
 * nameInput and sensorInput are built with it -- see cityFilterInputs in the
 * store.
 */
export interface SelectFilterInput {
  id: string;
  label: string;
  value: string | null;
  items: SelectOption[];
  hidden?: boolean;
}

/** A checkbox-style filter (the four show/hide toggles on the map). */
export interface ToggleFilterInput {
  id: string;
  label: string;
  value: boolean;
}

export type FilterInput = SelectFilterInput | ToggleFilterInput;
