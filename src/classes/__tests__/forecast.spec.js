import { describe, it, expect } from 'vitest';
import { Forecast } from '../forecast';

// 2024-01-15T10:30:00Z
const UNIX_TIME = 1705314600;

const apiForecast = {
  latitude: 41.9981,
  longitude: 21.4254,
  data: [
    { time: UNIX_TIME, pm10: 42, pm2_5: 21 },
    { time: UNIX_TIME + 3600, pm10: 45, pm2_5: 23 },
  ],
};

describe('Forecast.fromApi', () => {
  it('returns null for a missing payload rather than throwing', () => {
    expect(Forecast.fromApi(null)).toBeNull();
    expect(Forecast.fromApi(undefined)).toBeNull();
  });

  it('stringifies the coordinates into a position pair', () => {
    expect(Forecast.fromApi(apiForecast).position).toEqual([
      '41.9981',
      '21.4254',
    ]);
  });

  it('formats each timestamp as UTC DD/MM/YYYY HH:mm', () => {
    const { data } = Forecast.fromApi(apiForecast);

    expect(data).toHaveLength(2);
    expect(data[0].time).toBe('15/01/2024 10:30');
    expect(data[1].time).toBe('15/01/2024 11:30');
  });

  it('is timezone-independent — always formats in UTC', () => {
    // The formatting pins .tz('UTC') explicitly, so the result must not depend
    // on the machine's local timezone.
    expect(Forecast.fromApi(apiForecast).data[0].time).toBe('15/01/2024 10:30');
  });

  it('preserves the other measurement fields alongside the formatted time', () => {
    const [first] = Forecast.fromApi(apiForecast).data;

    expect(first.pm10).toBe(42);
    expect(first.pm2_5).toBe(21);
  });

  it('returns empty data when the payload carries none', () => {
    expect(Forecast.fromApi({ ...apiForecast, data: null }).data).toEqual([]);
  });

  // Regression guard: these used to throw. mapData() guarded its argument
  // while the line directly above it called latitude.toString() unguarded.
  it('returns an empty position when a coordinate is missing', () => {
    expect(Forecast.fromApi({ ...apiForecast, latitude: null }).position).toEqual(
      []
    );
    expect(
      Forecast.fromApi({ ...apiForecast, longitude: null }).position
    ).toEqual([]);
    expect(
      Forecast.fromApi({ ...apiForecast, latitude: undefined }).position
    ).toEqual([]);
  });

  it('still maps the data when the coordinates are missing', () => {
    const result = Forecast.fromApi({ ...apiForecast, latitude: null });

    expect(result.data).toHaveLength(2);
  });

  it('preserves a zero coordinate rather than treating it as missing', () => {
    // 0,0 is a legitimate (if unlikely) position; a truthiness check loses it.
    const result = Forecast.fromApi({
      ...apiForecast,
      latitude: 0,
      longitude: 0,
    });

    expect(result.position).toEqual(['0', '0']);
  });
});
