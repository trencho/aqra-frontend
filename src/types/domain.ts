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
export interface ForecastDatum {
  time: string;
  /**
   * Pollutant readings, as an open index rather than
   * `Partial<Record<PollutantKey, number>>`.
   *
   * Two reasons. The API returns whichever pollutants a given sensor reports
   * and adds new ones without notice, so a closed record would be a lie. And
   * under exactOptionalPropertyTypes a closed `aqi?: number` is not assignable
   * from the spread in Forecast.fromApi's mapData, whose source index signature
   * includes `undefined`.
   *
   * `string` is in the union because `time` above is a string and an index
   * signature has to cover every property of the interface.
   *
   * The cost is that consumers reading a pollutant get a widened type and have
   * to narrow to number -- which createMap has to do anyway, since Leaflet
   * needs numbers.
   */
  [pollutant: string]: number | string | undefined;
}

/**
 * An option in one of the filter selects.
 *
 * Both fields admit undefined because the options are built from domain
 * objects whose fields are optional: sensor options use `description` and
 * `sensorId`, pollutant options use `name` and `value`, and none of those is
 * guaranteed by the API.
 */
export interface SelectOption {
  label: string | undefined;
  value: string | null | undefined;
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
  /**
   * `string[]` because the pollutant select on the Statistics page carries
   * `multiple` (StatisticFilters.vue), so its value is an array of pollutant
   * keys, while the same pollutantInput on the Map page is single-valued. One
   * piece of state, two arities, decided by which page built it -- which is why
   * this is a union rather than two types.
   */
  value: string | readonly string[] | null;
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

/**
 * The shape `setValue` accepts: whichever filter input the emitting component
 * owns, plus its new value.
 *
 * Structurally wider than FilterInput on purpose. Which input is passed and
 * what type its value takes are correlated at runtime -- a 'name' input carries
 * a string, a 'showForAllCities' input carries a boolean -- but the emitting
 * component is what establishes that, and the store rediscovers it by switching
 * on `input.id`. Expressing it as a discriminated union here would require every
 * filter component to narrow before emitting, which is a component refactor
 * rather than a typing change.
 *
 * The mutable `value` is therefore unsound in the same way the .js was: nothing
 * stops a boolean being written into a select's value. The switch in setValue is
 * what actually keeps them aligned.
 */
export interface FilterInputLike {
  id: string;
  label?: string | undefined;
  value: FilterValue;
  items?: SelectOption[] | undefined;
  hidden?: boolean | undefined;
}

/**
 * Every value a filter can hold: select, multi-select, or toggle.
 *
 * `readonly` on the array arm because that is what Vuetify's multi-select emits
 * as `$event`.
 */
export type FilterValue = string | readonly string[] | boolean | null;

export interface SetValueConfig {
  input: FilterInputLike;
  value: FilterValue;
  /**
   * Passed as `true` by the Statistics pollutant select and **read by nothing**.
   * `setValue` switches on `input.id` and never looks at this flag.
   *
   * Declared rather than removed: deleting it from the one template that sets it
   * is a change to a component, and the point of this step is typing. It is a
   * dead payload field and is on the follow-up list.
   */
  isStatistics?: boolean | undefined;
}
