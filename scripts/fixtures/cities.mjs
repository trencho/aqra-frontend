/**
 * The city and sensor catalogue the mock API serves.
 *
 * Real North Macedonian cities with real coordinates, because the map is the
 * thing being verified: markers at plausible places, spread widely enough that
 * a heat layer over all of them is actually legible at the app's MIN_ZOOM of 9.
 *
 * Shapes here are `ApiCity` and `ApiSensor` from src/types/api.ts -- the shapes
 * the API sends, not the domain shapes the mappers produce. Two consequences
 * worth stating, because both look like mistakes:
 *
 *   - coordinates are STRINGS, and stay strings all the way to Leaflet;
 *   - the longitude key is spelled `longitute`. That misspelling is the
 *     upstream payload's, src/classes/city.ts reads it verbatim, and a test
 *     pins it. Spelling it correctly here yields [lat, undefined] for every
 *     city and an empty map.
 */

/** Rough square boundary around a centre, for the city-boundaries toggle. */
function borderBox(lat, lon, halfSide = 0.06) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  return [
    [latitude + halfSide, longitude - halfSide],
    [latitude + halfSide, longitude + halfSide],
    [latitude - halfSide, longitude + halfSide],
    [latitude - halfSide, longitude - halfSide],
  ].map(([a, o]) => ({ latitude: a.toFixed(4), longitute: o.toFixed(4) }));
}

/**
 * Sensor coordinates are offset from the city centre so sensor markers and the
 * per-sensor heat layer are distinguishable from the city marker underneath.
 */
function sensorAt(cityName, id, description, lat, lon, dLat, dLon) {
  return {
    type: 'station',
    status: 'active',
    cityName,
    sensorId: id,
    position: `${(Number(lat) + dLat).toFixed(4)},${(Number(lon) + dLon).toFixed(4)}`,
    comments: '',
    description,
  };
}

const CATALOGUE = [
  {
    cityName: 'skopje',
    siteName: 'Skopje',
    lat: '41.9981',
    lon: '21.4254',
    zoom: 12,
    sensors: [
      ['skopje_centar', 'Centar', 0.008, -0.006],
      ['skopje_karpos', 'Karpoš', 0.012, -0.031],
      ['skopje_lisice', 'Lisiče', -0.019, 0.024],
    ],
  },
  {
    cityName: 'bitola',
    siteName: 'Bitola',
    lat: '41.0297',
    lon: '21.3292',
    zoom: 12,
    sensors: [
      ['bitola_centar', 'Centar', 0.006, 0.005],
      ['bitola_zheleznik', 'Železnik', -0.014, -0.018],
    ],
  },
  {
    cityName: 'kumanovo',
    siteName: 'Kumanovo',
    lat: '42.1322',
    lon: '21.7144',
    zoom: 12,
    sensors: [['kumanovo_centar', 'Centar', 0.005, 0.007]],
  },
  {
    cityName: 'prilep',
    siteName: 'Prilep',
    lat: '41.3464',
    lon: '21.5542',
    zoom: 12,
    sensors: [['prilep_centar', 'Centar', -0.007, 0.009]],
  },
  {
    cityName: 'tetovo',
    siteName: 'Tetovo',
    lat: '42.0106',
    lon: '20.9714',
    zoom: 12,
    sensors: [
      ['tetovo_centar', 'Centar', 0.004, 0.006],
      ['tetovo_gjorche', 'Gjorče Petrov', -0.011, -0.013],
    ],
  },
  {
    cityName: 'ohrid',
    siteName: 'Ohrid',
    lat: '41.1231',
    lon: '20.8016',
    zoom: 12,
    sensors: [['ohrid_centar', 'Centar', 0.006, 0.004]],
  },
];

export const cities = CATALOGUE.map((c) => ({
  siteUrl: `https://aqra.feit.ukim.edu.mk/${c.cityName}`,
  cityName: c.cityName,
  siteName: c.siteName,
  siteTitle: `${c.siteName}, North Macedonia`,
  countryCode: 'MK',
  countryName: 'North Macedonia',
  initialZoomLevel: c.zoom,
  cityLocation: { latitude: c.lat, longitute: c.lon },
  cityBorderPoints: borderBox(c.lat, c.lon),
}));

export const sensorsByCity = Object.fromEntries(
  CATALOGUE.map((c) => [
    c.cityName,
    c.sensors.map(([id, description, dLat, dLon]) =>
      sensorAt(c.cityName, id, description, c.lat, c.lon, dLat, dLon)
    ),
  ])
);

/** Every sensor, keyed by id, with the coordinates its forecast reports. */
export const sensorsById = Object.fromEntries(
  Object.values(sensorsByCity)
    .flat()
    .map((s) => [s.sensorId, s])
);

export function cityByName(name) {
  return cities.find((c) => c.cityName === name);
}

/**
 * The city whose centre is nearest a coordinate pair.
 *
 * getForecastBySpecificCoordinates is called with a city's own centre, so an
 * exact match would do -- but float formatting differs between what we serve
 * and what comes back, and a silent miss here renders as an empty heat layer
 * rather than an error. Nearest-match cannot fail that way.
 */
export function cityNearest(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return undefined;
  }

  return cities.reduce((best, c) => {
    const d =
      (Number(c.cityLocation.latitude) - lat) ** 2 +
      (Number(c.cityLocation.longitute) - lon) ** 2;
    return !best || d < best.d ? { d, city: c } : best;
  }, undefined)?.city;
}
