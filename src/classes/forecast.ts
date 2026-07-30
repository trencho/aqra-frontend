import moment from 'moment-timezone';

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

function mapData(data?: ApiForecastDatum[] | null): ForecastDatum[] {
  if (!data) {
    return [];
  }

  return data.map((d) => ({
    ...d,
    time: moment.unix(d.time).tz('UTC').format('DD/MM/YYYY HH:mm'),
  }));
}
