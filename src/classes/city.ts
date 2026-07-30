import type { Forecast } from '@/classes/forecast';
import type { Sensor } from '@/classes/sensors';
import type { ApiCity, ApiCoordinates } from '@/types/api';
import type { Position } from '@/types/domain';

/**
 * Every key is required and may hold undefined, rather than being optional.
 *
 * That is the accurate description under exactOptionalPropertyTypes: fromApi is
 * the only caller and it always passes all nine keys, some of them undefined
 * when the payload omitted the field. `siteUrl?: string` would mean "absent, or
 * a string, but never explicitly undefined" -- which is not what happens here,
 * and EOPT rejected it.
 */
export interface CityConfig {
  borders: Position[];
  siteUrl: string | undefined;
  cityName: string | undefined;
  siteName: string | undefined;
  position: Position;
  siteTitle: string | undefined;
  countryCode: string | undefined;
  countryName: string | undefined;
  initialZoomLevel: number | undefined;
}

export class City {
  borders: Position[];
  siteUrl: string | undefined;
  cityName: string | undefined;
  siteName: string | undefined;
  position: Position;
  siteTitle: string | undefined;
  countryCode: string | undefined;
  countryName: string | undefined;
  initialZoomLevel: number | undefined;

  /**
   * Both attached later by the store (setSensorsByCity, setForecastForCity),
   * never by fromApi.
   *
   * `declare` rather than plain fields: under useDefineForClassFields a bare
   * declaration emits a field initialiser, which would add these as own
   * properties set to undefined on every city. `declare` is type-only and emits
   * nothing, so the runtime object shape stays exactly what the .js version
   * produced.
   */
  declare sensors?: Record<string, Sensor>;
  declare forecast?: Forecast | null;

  constructor(config: CityConfig) {
    this.borders = config.borders;
    this.siteUrl = config.siteUrl;
    this.cityName = config.cityName;
    this.siteName = config.siteName;
    this.position = config.position;
    this.siteTitle = config.siteTitle;
    this.countryCode = config.countryCode;
    this.countryName = config.countryName;
    this.initialZoomLevel = config.initialZoomLevel;
  }

  static fromApi(city?: ApiCity | null): City | null {
    if (!city) {
      return null;
    }

    const {
      siteUrl,
      cityName,
      siteName,
      siteTitle,
      countryCode,
      countryName,
      cityLocation,
      initialZoomLevel,
      cityBorderPoints,
    } = city;

    return new City({
      cityName,
      siteUrl,
      siteName,
      siteTitle,
      countryCode,
      countryName,
      initialZoomLevel,
      position: mapLocationCoordinates(cityLocation),
      borders: mapBorders(cityBorderPoints),
    });
  }
}

/**
 * Reads `longitute`, the upstream misspelling, deliberately.
 *
 * ApiCoordinates declares it the same way. "Correcting" the spelling here
 * yields [lat, undefined] for every city, silently; there is a test pinning
 * that, and now the type pins it too.
 */
function mapLocationCoordinates(
  cityLocation?: ApiCoordinates | null
): Position {
  if (!cityLocation) {
    return [];
  }

  return [cityLocation.latitude, cityLocation.longitute];
}

function mapBorders(borders?: ApiCoordinates[] | null): Position[] {
  return (borders || []).map((s) => mapLocationCoordinates(s));
}
