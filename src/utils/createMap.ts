import type {
  HeatLatLngTuple,
  HeatLayer,
  LatLngTuple,
  Layer,
  Map as LeafletMap,
  Marker,
  Polygon,
  TileLayer,
} from 'leaflet';
import L from 'leaflet';

import { mapOptions, MAX_ZOOM, MIN_ZOOM } from '@/constants/map';
import { PollutantRatio } from '@/constants/pollutants';
import type { ForecastDatum, PollutantKey, Position } from '@/types/domain';

/**
 * The parameters are structural -- `{ position }`, `{ borders }` -- rather than
 * City and Sensor. These helpers only ever read one or two fields, so demanding
 * a whole domain object would be a wider contract than the code needs, and
 * would force every test fixture to construct one.
 */
interface HasPosition {
  position: Position;
}

interface CityMarkerSource extends HasPosition {
  siteName?: string | undefined;
}

interface SensorMarkerSource extends HasPosition {
  description?: string | undefined;
}

interface ForecastSource {
  position: Position;
  data: ForecastDatum[];
}

interface WithForecast {
  forecast?: ForecastSource | null | undefined;
}

export interface HeatLayerResult {
  heatLayer: HeatLayer;
  time: string[];
}

/**
 * Hands a string coordinate pair to Leaflet's numeric API.
 *
 * **This must not convert.** Leaflet coerces coordinates with a unary `+`
 * internally, this app has always passed the API's strings straight through,
 * and createMap.spec.js pins exactly that -- e.g.
 * `expect(L.marker).toHaveBeenCalledWith(['41.99', '21.42'])` and
 * `expect(m.fitBounds).toHaveBeenCalledWith([['41.99', '21.42']])`.
 *
 * The migration plan originally proposed converting to numbers here. The specs
 * ruled it out: four assertions across createMap.spec assert the string form,
 * so converting would be a behaviour change dressed up as a type fix. This is a
 * type-level assertion and nothing more, kept in one named place so the lie is
 * visible instead of scattered as inline casts.
 */
function asLatLng(position: Position): LatLngTuple {
  return position as unknown as LatLngTuple;
}

/** As asLatLng, for a [lat, lng, intensity] triple. Also does not convert. */
function asHeatPoint(position: Position, intensity: number): HeatLatLngTuple {
  return [...position, intensity] as unknown as HeatLatLngTuple;
}

/**
 * `sensors` is optional in the parameter type because it is optional on City,
 * and a city whose sensors have not loaded yet is a state the app reaches: the
 * sensor-markers toggle can be flipped before the fetches resolve.
 *
 * This used to dereference `c.sensors` unguarded and throw a TypeError on
 * exactly that path, one line away from mapCities' `(cities || [])`. Skipping
 * such a city matches what every other helper in this module does with absent
 * input, and the markers appear on the next render once the sensors arrive.
 */
export function mapSensorsInCities(
  map: LeafletMap,
  cities: Array<{ sensors?: Record<string, SensorMarkerSource> | undefined }>
): Marker[] {
  const markers: Marker[] = [];
  cities.forEach((c) =>
    Object.values(c.sensors ?? {}).forEach((s) => {
      const marker = L.marker(asLatLng(s.position)).addTo(map);
      // `as string` because description is optional on a Sensor and Leaflet's
      // bindPopup does not accept undefined. Passing it through unchanged is
      // the pre-existing behaviour.
      marker.bindPopup(s.description as string);
      markers.push(marker);
    })
  );
  return markers;
}

export function mapCities(
  map: LeafletMap,
  cities: CityMarkerSource[] | null | undefined
): Marker[] {
  const markers: Marker[] = [];
  (cities || []).forEach((s) => {
    const marker = L.marker(asLatLng(s.position)).addTo(map);
    marker.bindPopup(s.siteName as string);
    markers.push(marker);
  });
  return markers;
}

export function createCityBoundaries(
  map: LeafletMap,
  cities: Array<{ borders: Position[] }> | null | undefined
): Polygon[] {
  const polygons: Polygon[] = [];
  (cities || []).forEach((s) => {
    const polygon = L.polygon(
      s.borders as unknown as LatLngTuple[],
      { color: 'red' }
    ).addTo(map);
    polygons.push(polygon);
  });
  return polygons;
}

/**
 * `readonly unknown[]` rather than `Layer[]`, for two reasons that point the
 * same way.
 *
 * The caller is Map.vue, which holds its layers in `data()`. Vue's reactive
 * typing rebuilds a class instance structurally and drops private members, so a
 * Marker[] or HeatLayer[] read back off the component no longer satisfies
 * `Layer[]` despite being exactly that at runtime. Widening here fixes six call
 * sites at once instead of asserting at each.
 *
 * And it is honest about what this function does: it forwards each element to
 * Leaflet and looks at nothing itself. removeLayer.spec passes `[{id: 1}]`.
 */
export function removeLayer(
  map: LeafletMap,
  layers: readonly unknown[] | null | undefined
): null {
  (layers || []).forEach((l) => map.removeLayer(l as Layer));
  return null;
}

export function createBaseLayer(map: LeafletMap): TileLayer {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    attribution:
      '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    id: 'map',
  }).addTo(map);
}

interface CreateHeatLayerOptions {
  city: { sensors: Record<string, WithForecast> };
  sensorId: string;
  pollutant: PollutantKey;
  time?: number;
}

/**
 * The non-null assertions below are deliberate and behaviour-preserving.
 *
 * The .js version dereferenced `city.sensors[sensorId].forecast.data[time]`
 * with no checks at all, so a missing sensor, forecast or time index threw.
 * noUncheckedIndexedAccess surfaces every one of those, but inserting guards
 * would change what happens on bad input, and this module's error behaviour is
 * pinned by characterization tests. Asserting keeps the emitted code identical.
 */
export function createHeatLayer(
  map: LeafletMap,
  { city, sensorId, pollutant, time = 0 }: CreateHeatLayerOptions
): HeatLayerResult {
  const sensor = city.sensors[sensorId]!;
  const forecast = sensor.forecast!;
  // `as number` rather than Number(): the readings are numeric, and a cast
  // emits nothing, where a conversion call would be a (semantically identical
  // but real) runtime change.
  const pollution = forecast.data[time]![pollutant] as number;
  map.fitBounds([asLatLng(forecast.position)]);

  const heat = asHeatPoint(
    forecast.position,
    pollution / PollutantRatio[pollutant]
  );

  const heatLayer = L.heatLayer([heat], mapOptions).addTo(map);
  return {
    time: forecast.data.map((t) => t.time),
    heatLayer,
  };
}

interface CreateHeatLayersOptions {
  cities: WithForecast[];
  pollutant: PollutantKey;
  time?: number;
}

/**
 * Divides by PollutantRatio, as createHeatLayer above does.
 *
 * It used to pass the raw reading straight through, so the same measurement
 * rendered at wildly different intensities depending on which toggle was
 * active: a pm10 reading of 60 is an intensity of 0.05 through createHeatLayer
 * and 60 -- far past the gradient's 1.0 ceiling, i.e. solid red -- through this
 * one. Two views of the same data disagreeing about what counts as bad is worse
 * than either scale being wrong.
 */
export function createHeatLayers(
  map: LeafletMap,
  { cities, pollutant, time = 0 }: CreateHeatLayersOptions
): HeatLayerResult {
  const points = cities
    .map((c) => {
      const reading = c.forecast?.data[time]?.[pollutant];
      return reading
        ? asHeatPoint(
            c.forecast!.position,
            (reading as number) / PollutantRatio[pollutant]
          )
        : null;
    })
    // A narrowing predicate rather than `.filter((i) => i)`: same runtime
    // result (a heat tuple is always truthy), but it drops `null` from the
    // element type so the array satisfies heatLayer's parameter.
    .filter((p): p is HeatLatLngTuple => p !== null);

  const heatLayer = L.heatLayer(points, mapOptions).addTo(map);

  return {
    heatLayer,
    time: cities[0]!.forecast!.data.map((t) => t.time),
  };
}

interface CreateSensorHeatLayersOptions {
  cities: Array<{ sensors: Record<string, WithForecast> }>;
  pollutant: PollutantKey;
  time?: number;
}

/** Divides by PollutantRatio, for the reason given on createHeatLayers above. */
export function createSensorHeatLayers(
  map: LeafletMap,
  { cities, pollutant, time = 0 }: CreateSensorHeatLayersOptions
): HeatLayerResult {
  const points = cities
    .map((c) =>
      Object.values(c.sensors)
        .map((s) => {
          const reading = s.forecast?.data[time]?.[pollutant];
          return reading
            ? asHeatPoint(
                s.forecast!.position,
                (reading as number) / PollutantRatio[pollutant]
              )
            : null;
        })
        .filter((p): p is HeatLatLngTuple => p !== null)
    )
    .flat();

  const heatLayer = L.heatLayer(points, mapOptions).addTo(map);

  return {
    heatLayer,
    time: Object.values(cities[0]!.sensors)[0]!.forecast!.data.map(
      (t) => t.time
    ),
  };
}
