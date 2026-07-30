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
  latitude?: string;
  /** sic -- upstream misspelling, load-bearing. */
  longitute?: string;
}

export interface ApiCity {
  siteUrl?: string;
  cityName?: string;
  siteName?: string;
  siteTitle?: string;
  countryCode?: string;
  countryName?: string;
  initialZoomLevel?: number;
  cityLocation?: ApiCoordinates | null;
  cityBorderPoints?: ApiCoordinates[] | null;
}

export interface ApiSensor {
  type?: string;
  status?: string;
  cityName?: string;
  sensorId?: string;
  /** A single comma-separated pair, e.g. "41.9981,21.4254". */
  position?: string | null;
  comments?: string;
  description?: string;
}

/**
 * One measurement row. `time` is unix seconds here; the mapper formats it.
 *
 * The pollutant readings are an open index rather than a closed
 * Record<PollutantKey, number> because the API returns whichever pollutants a
 * given sensor reports, and adds new ones without notice.
 */
export interface ApiForecastDatum {
  time?: number;
  [pollutant: string]: number | undefined;
}

/**
 * Note the coordinates here are numbers, unlike ApiCity's strings. That
 * inconsistency is upstream's, not ours -- src/classes/forecast.ts is where the
 * two are reconciled onto one representation.
 */
export interface ApiForecast {
  latitude?: number | null;
  longitude?: number | null;
  data?: ApiForecastDatum[] | null;
}

export interface ApiPollutant {
  name?: string;
  value?: string;
}
