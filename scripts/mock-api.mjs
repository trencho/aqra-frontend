/**
 * A local stand-in for the AQRA API, so the app can be exercised end to end
 * without the production backend.
 *
 * It exists because production returns 503 -- the `flask` deployment has no
 * image -- and the manual acceptance pass (does the Leaflet map actually draw?
 * does the Chart.js chart actually paint?) cannot be done against a dead API.
 * The unit suite cannot answer either question: jsdom has no canvas 2D context,
 * so Chart.js is asserted against its registry rather than by rendering.
 *
 * Zero dependencies, on purpose: this is developer tooling, and adding a mock
 * framework to a production lockfile to serve six endpoints is a bad trade.
 *
 *   yarn mock-api     # this server, on :8081
 *   yarn dev:mock     # vite --mode mock, which points the app at it
 *
 * The app reads VITE_AQRA_API_URL (see src/services/axios.ts); .env.mock sets
 * it to this server's base URL.
 */
import { createServer } from 'node:http';

import {
  cities,
  cityByName,
  cityNearest,
  sensorsByCity,
  sensorsById,
} from './fixtures/cities.mjs';
import { forecastFor } from './fixtures/readings.mjs';

const PORT = Number(process.env.PORT || 8081);
const BASE = '/api/v1';

/**
 * Mirrors src/constants/pollutants.ts. Duplicated rather than imported: this is
 * a plain .mjs script outside the TypeScript build, and reaching into src/ for
 * a nine-line constant would drag the whole alias/transpile setup in with it.
 * The pollutants.spec suite is what keeps the src copy honest.
 */
const POLLUTANTS = [
  ['AQI', 'aqi'],
  ['CO', 'co'],
  ['NH3', 'nh3'],
  ['NO', 'no'],
  ['NO2', 'no2'],
  ['O3', 'o3'],
  ['PM2.5', 'pm2_5'],
  ['PM10', 'pm10'],
  ['SO2', 'so2'],
].map(([name, value]) => ({ name, value }));

/** Trailing slashes are load-bearing upstream; tolerate both here. */
function segments(pathname) {
  return pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
  });
  res.end(payload);
}

function notFound(res, what) {
  json(res, 404, { error: what });
}

/** "41.9981,21.4254" -> ['41.9981', '21.4254'] */
function pair(segment) {
  const [latitude, longitude] = decodeURIComponent(segment).split(',');
  return [latitude, longitude];
}

const APIDOCS = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>AQRA API (mock)</title>
<style>
  body { font: 16px/1.6 system-ui, sans-serif; margin: 0; padding: 2rem; color: #1a1a1a; }
  h1 { margin-top: 0; font-size: 1.4rem; }
  code { background: #f2f2f2; padding: .15rem .35rem; border-radius: 3px; }
  li { margin: .3rem 0; }
  .note { background: #fff8e1; border-left: 4px solid #f5c518; padding: .75rem 1rem; }
</style></head><body>
<h1>AQRA API &mdash; mock</h1>
<p class="note">This is the local mock server, not the real Swagger UI. The
production documentation lives at <code>/api/v1/apidocs/</code> on the AQRA host
and is served by the Flask backend.</p>
<p>Endpoints implemented here:</p>
<ul>
  <li><code>GET /api/v1/cities/</code></li>
  <li><code>GET /api/v1/cities/{city}/sensors/</code></li>
  <li><code>GET /api/v1/cities/coordinates/{lat},{lon}/forecast/</code></li>
  <li><code>GET /api/v1/cities/{city}/sensors/{id}/forecast/</code></li>
  <li><code>GET /api/v1/cities/{city}/sensors/{id}/pollutants/</code></li>
  <li><code>GET /api/v1/cities/{city}/sensors/{id}/history/{type}/</code></li>
</ul>
</body></html>`;

function route(pathname, res) {
  if (!pathname.startsWith(BASE)) {
    return notFound(res, `No route for ${pathname}; the base path is ${BASE}`);
  }

  const parts = segments(pathname.slice(BASE.length));

  // /apidocs/ -- the Swagger tab's iframe.
  if (parts[0] === 'apidocs') {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'access-control-allow-origin': '*',
    });
    return res.end(APIDOCS);
  }

  if (parts[0] !== 'cities') {
    return notFound(res, `Unhandled collection: ${parts[0] ?? '(none)'}`);
  }

  // /cities/
  if (parts.length === 1) {
    return json(res, 200, cities);
  }

  // /cities/coordinates/{lat},{lon}/forecast/
  // Checked before the {city} routes below: "coordinates" would otherwise be
  // read as a city name.
  if (parts[1] === 'coordinates') {
    const [latitude, longitude] = pair(parts[2] ?? '');
    const city = cityNearest(latitude, longitude);
    if (!city) {
      return notFound(res, `No city near ${latitude},${longitude}`);
    }
    if (parts[3] !== 'forecast') {
      return notFound(res, `Unhandled coordinates route: ${pathname}`);
    }
    return json(
      res,
      200,
      forecastFor(
        `city:${city.cityName}`,
        city.cityLocation.latitude,
        city.cityLocation.longitute
      )
    );
  }

  const cityName = decodeURIComponent(parts[1]);
  const city = cityByName(cityName);
  if (!city) {
    return notFound(res, `Unknown city: ${cityName}`);
  }

  // /cities/{city}/
  if (parts.length === 2) {
    return json(res, 200, city);
  }

  if (parts[2] !== 'sensors') {
    return notFound(res, `Unhandled city route: ${pathname}`);
  }

  // /cities/{city}/sensors/
  if (parts.length === 3) {
    return json(res, 200, sensorsByCity[cityName] ?? []);
  }

  const sensorId = decodeURIComponent(parts[3]);
  const sensor = sensorsById[sensorId];
  if (!sensor || sensor.cityName !== cityName) {
    return notFound(res, `Unknown sensor ${sensorId} in ${cityName}`);
  }

  const [latitude, longitude] = sensor.position.split(',');

  // /cities/{city}/sensors/{id}/
  if (parts.length === 4) {
    return json(res, 200, sensor);
  }

  switch (parts[4]) {
    // /cities/{city}/sensors/{id}/forecast/
    case 'forecast':
      return json(
        res,
        200,
        forecastFor(`sensor:${sensorId}`, latitude, longitude)
      );

    // /cities/{city}/sensors/{id}/pollutants/
    case 'pollutants':
      return json(res, 200, POLLUTANTS);

    // /cities/{city}/sensors/{id}/history/{dataType}/
    case 'history':
      return json(
        res,
        200,
        forecastFor(
          `history:${sensorId}:${parts[5] ?? 'pollution'}`,
          latitude,
          longitude
        )
      );

    default:
      return notFound(res, `Unhandled sensor route: ${pathname}`);
  }
}

const server = createServer((req, res) => {
  // axios sends `Accept: *`, which is CORS-safelisted, so no preflight is
  // expected -- but answering OPTIONS costs nothing and removes a whole class
  // of confusing failure if that ever changes.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': '*',
      'access-control-max-age': '86400',
    });
    return res.end();
  }

  if (req.method !== 'GET') {
    return json(res, 405, { error: `${req.method} not allowed` });
  }

  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  try {
    route(pathname, res);
  } catch (cause) {
    // A throw here would otherwise take the whole server down mid-pass and
    // look, from the browser, exactly like the backend being dead.
    console.error(`[mock-api] 500 ${pathname}`, cause);
    json(res, 500, { error: String(cause) });
  }
});

server.listen(PORT, () => {
  const sensorCount = Object.values(sensorsByCity).flat().length;
  console.log(
    `[mock-api] http://localhost:${PORT}${BASE} -- ` +
      `${cities.length} cities, ${sensorCount} sensors, 24h of readings`
  );
  console.log('[mock-api] point the app at it with: yarn dev:mock');
});
