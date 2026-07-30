import type { Forecast } from '@/classes/forecast';
import type { ApiSensor } from '@/types/api';
import type { Position } from '@/types/domain';

export interface SensorConfig {
  type: string | undefined;
  status: string | undefined;
  cityName: string | undefined;
  sensorId: string | undefined;
  position: Position;
  comments: string | undefined;
  description: string | undefined;
}

export class Sensor {
  type: string | undefined;
  status: string | undefined;
  cityName: string | undefined;
  sensorId: string | undefined;
  position: Position;
  comments: string | undefined;
  description: string | undefined;

  /**
   * Attached later by the store's setForecastForSensor, not by fromApi.
   *
   * `declare` rather than a plain field: under useDefineForClassFields a bare
   * declaration emits a field initialiser, which would add `forecast` as an own
   * property set to undefined on every sensor. `declare` is type-only and emits
   * nothing, so the runtime object shape stays exactly what the .js version
   * produced.
   */
  declare forecast?: Forecast | null;

  constructor(config: SensorConfig) {
    this.type = config.type;
    this.status = config.status;
    this.cityName = config.cityName;
    this.sensorId = config.sensorId;
    this.position = config.position;
    this.comments = config.comments;
    this.description = config.description;
  }

  static fromApi(sensor?: ApiSensor | null): Sensor | null {
    if (!sensor) {
      return null;
    }

    const { type, status, cityName, sensorId, position, comments, description } =
      sensor;

    return new Sensor({
      type,
      status,
      cityName,
      sensorId,
      position: formatPosition(position),
      comments,
      description,
    });
  }
}

function formatPosition(position?: string | null): Position {
  // A sensor with no position used to throw here, one guard away from the
  // `if (!sensor) return null` above. city.ts handles the same case by
  // returning an empty coordinate pair; match it.
  if (!position) {
    return [];
  }

  return position.split(',');
}
