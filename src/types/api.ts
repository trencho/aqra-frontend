/**
 * The shapes the AQRA API actually sends, as opposed to the shapes we would
 * like it to send. The domain types in ./domain.ts are what the mappers in
 * src/classes/ produce from these.
 *
 * Every field is optional. That is not defensiveness for its own sake: the
 * mappers in src/classes/ all guard their inputs and each of those guards
 * exists because a real payload arrived without the field and threw. Declaring
 * them required would type away the reason the guards are there.
 *
 * Every field is also explicitly `| undefined` on top of the `?`. Under
 * exactOptionalPropertyTypes those mean different things -- `?` alone is
 * "absent, or a value, but never explicitly undefined" -- and callers routinely
 * build these with a spread plus an override (`{ ...payload, latitude: undefined }`,
 * which the specs do to exercise the guards). "Absent or explicitly undefined"
 * is the truthful description of data arriving from an external API.
 *
 * Coordinates arrive as *strings* here, and stay strings all the way through
 * the domain layer -- see the Position note in ./domain.ts.
 */

/**
 * A coordinate pair as the upstream API spells it.
 *
 * `longitute` is NOT a typo in this file. The upstream payload really does
 * misspell it, src/classes/city.ts reads it verbatim, and a test pins the
 * behaviour. Declaring the correct spelling here would make the correct code
 * look wrong and the wrong code type-check.
 */
export interface ApiCoordinates {
  latitude?: string | undefined;
  /** sic -- upstream misspelling, load-bearing. */
  longitute?: string | undefined;
}

export interface ApiCity {
  siteUrl?: string | undefined;
  cityName?: string | undefined;
  siteName?: string | undefined;
  siteTitle?: string | undefined;
  countryCode?: string | undefined;
  countryName?: string | undefined;
  initialZoomLevel?: number | undefined;
  cityLocation?: ApiCoordinates | null | undefined;
  cityBorderPoints?: ApiCoordinates[] | null | undefined;
}

export interface ApiSensor {
  type?: string | undefined;
  status?: string | undefined;
  cityName?: string | undefined;
  sensorId?: string | undefined;
  /** A single comma-separated pair, e.g. "41.9981,21.4254". */
  position?: string | null | undefined;
  comments?: string | undefined;
  description?: string | undefined;
}

/**
 * One measurement row. `time` is unix seconds here; the mapper formats it.
 *
 * The pollutant readings are an open index rather than a closed
 * Record<PollutantKey, number> because the API returns whichever pollutants a
 * given sensor reports, and adds new ones without notice.
 */
export interface ApiForecastDatum {
  /** Unix seconds. Required: the guard in the mapper is on `data` being absent
   *  entirely, never on an individual row lacking its timestamp. */
  time: number;
  [pollutant: string]: number | undefined;
}

/**
 * Note the coordinates here are numbers, unlike ApiCity's strings. That
 * inconsistency is upstream's, not ours -- src/classes/forecast.ts is where the
 * two are reconciled onto one representation.
 */
export interface ApiForecast {
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  data?: ApiForecastDatum[] | null | undefined;
}

export interface ApiPollutant {
  name?: string | undefined;
  /**
   * `number` as well as `string`: pollutant.spec passes numeric readings and has
   * a test asserting a zero value survives ("0 is a legitimate reading"). The
   * select-option path treats this as an identifier, the reading path as a
   * measurement, and the payload carries both shapes.
   */
  value?: string | number | undefined;
}
