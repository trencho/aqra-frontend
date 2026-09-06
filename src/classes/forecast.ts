import type { ApiForecast, ApiForecastDatum } from '@/types/api';
import type { ForecastDatum, Position } from '@/types/domain';

export interface ForecastConfig {
  position: Position;
  data: ForecastDatum[];
}

export class Forecast {
  data: ForecastDatum[];
  position: Position;

  constructor(config: ForecastConfig) {
    this.data = config.data;
    this.position = config.position;
  }

  static fromApi(city?: ApiForecast | null): Forecast | null {
    if (!city) {
      return null;
    }

    const { data, latitude, longitude } = city;

    return new Forecast({
      // mapData() guarded its argument; these two did not, one line apart, so
      // a record missing either coordinate threw.
      position: mapPosition(latitude, longitude),
      data: mapData(data),
    });
  }
}

function mapPosition(
  latitude?: number | null,
  longitude?: number | null
): Position {
  // Explicit null/undefined checks rather than truthiness: 0,0 is a legitimate
  // position and a falsy test would discard it. Pinned by a test.
  if (latitude === null || latitude === undefined) {
    return [];
  }
  if (longitude === null || longitude === undefined) {
    return [];
  }

  return [latitude.toString(), longitude.toString()];
}

function pad(value: number, width: number): string {
  return value.toString().padStart(width, '0');
}

/**
 * Format unix seconds as `DD/MM/YYYY HH:mm` in UTC.
 *
 * This used to be moment-timezone's `.unix(t).tz('UTC').format(...)`, which
 * pulled the whole IANA database -- roughly 654 KB, about a third of the
 * production chunk -- into the bundle to serve this one call. 'UTC' is a fixed
 * zone with no rules to look up, so the database was never consulted.
 *
 * Written as explicit getUTC* reads rather than Intl.DateTimeFormat, whose
 * output for a given locale can move with an ICU update. These digits cannot.
 */
function formatUtc(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);

  const date = `${pad(d.getUTCDate(), 2)}/${pad(d.getUTCMonth() + 1, 2)}/${pad(d.getUTCFullYear(), 4)}`;
  const time = `${pad(d.getUTCHours(), 2)}:${pad(d.getUTCMinutes(), 2)}`;

  return `${date} ${time}`;
}

function mapData(data?: ApiForecastDatum[] | null): ForecastDatum[] {
  if (!data) {
    return [];
  }

  return data.map((d) => ({
    ...d,
    time: formatUtc(d.time),
  }));
}
