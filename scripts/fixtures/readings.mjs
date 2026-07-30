/**
 * Deterministic 24-hour pollution series.
 *
 * Generated rather than checked in as JSON: six cities x nine pollutants x 24
 * hours is ~1,300 readings per series set, which as a literal would be a large
 * unreviewable blob. A seeded generator is the same data, and you can read the
 * shape of it.
 *
 * Deterministic on purpose -- same sensor, same hour, same number on every run
 * -- so a screenshot taken during the acceptance pass can be compared against a
 * later one and any difference is the app changing, not the fixture.
 */

/** FNV-1a, for turning a fixture key into a seed. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** mulberry32 -- small, fast, and good enough for fixture noise. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plausible ranges, in the units the real API reports.
 *
 * These are NOT tuned to make the heatmap look good. The app divides a reading
 * by constants/pollutants.ts's PollutantRatio to get a 0..1 intensity, and with
 * honest readings some pollutants land very low (pm10 at 160 over a ratio of
 * 1200 is 0.13) while aqi saturates. That is the app's own scaling, and the
 * acceptance pass should see it rather than a fixture that hides it.
 */
const RANGES = {
  aqi: [20, 180],
  co: [200, 1200],
  nh3: [0.2, 3],
  no: [0.5, 40],
  no2: [5, 90],
  o3: [10, 120],
  pm2_5: [5, 90],
  pm10: [10, 160],
  so2: [2, 40],
};

export const HOURS = 24;

/** Midnight UTC today, so `time` formats as a full readable day in the slider. */
export function startOfDayUnix(now = new Date()) {
  return Math.floor(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ) / 1000
  );
}

/**
 * One 24-hour series for a fixture key.
 *
 * Each pollutant gets a per-key baseline plus a diurnal swing, so values move
 * across the day and the time slider visibly redraws the heat layer. Without
 * that swing every slider position renders identically and the control looks
 * broken when it is not.
 */
export function seriesFor(key, { hours = HOURS, now = new Date() } = {}) {
  const base = startOfDayUnix(now);

  return Array.from({ length: hours }, (_, hour) => {
    const datum = { time: base + hour * 3600 };

    for (const [pollutant, [lo, hi]] of Object.entries(RANGES)) {
      const random = rng(hash(`${key}:${pollutant}`));
      // Fixed per key/pollutant, so the shape of a sensor's day is stable.
      const level = lo + random() * (hi - lo);
      const swing = 0.35 + 0.65 * random();

      // Two peaks, morning and evening, which is what traffic-driven
      // pollutants actually do.
      const diurnal =
        0.5 *
        (Math.sin(((hour - 4) / 24) * 2 * Math.PI) +
          Math.sin(((hour - 4) / 12) * 2 * Math.PI));

      const value = level * (1 + swing * diurnal * 0.5);
      datum[pollutant] = Number(Math.max(lo * 0.4, value).toFixed(2));
    }

    return datum;
  });
}

/** An ApiForecast for a coordinate pair. Coordinates are NUMBERS here, unlike ApiCity's strings. */
export function forecastFor(key, latitude, longitude, options) {
  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
    data: seriesFor(key, options),
  };
}
