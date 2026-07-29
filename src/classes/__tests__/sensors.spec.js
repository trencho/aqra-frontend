import { describe, it, expect } from 'vitest';
import { Sensor } from '../sensors';

const apiSensor = {
  type: 'pulse.eco',
  status: 'ACTIVE',
  cityName: 'skopje',
  sensorId: 'sensor-1',
  position: '41.9981,21.4254',
  comments: 'rooftop',
  description: 'Centar',
};

describe('Sensor.fromApi', () => {
  it('returns null for a missing sensor rather than throwing', () => {
    expect(Sensor.fromApi(null)).toBeNull();
    expect(Sensor.fromApi(undefined)).toBeNull();
  });

  it('carries the scalar fields through unchanged', () => {
    const sensor = Sensor.fromApi(apiSensor);

    expect(sensor).toBeInstanceOf(Sensor);
    expect(sensor.type).toBe('pulse.eco');
    expect(sensor.status).toBe('ACTIVE');
    expect(sensor.cityName).toBe('skopje');
    expect(sensor.sensorId).toBe('sensor-1');
    expect(sensor.comments).toBe('rooftop');
    expect(sensor.description).toBe('Centar');
  });

  it('splits the comma-separated position into a coordinate pair', () => {
    expect(Sensor.fromApi(apiSensor).position).toEqual(['41.9981', '21.4254']);
  });

  // CHARACTERIZATION TEST -- pins a known bug, not desired behaviour.
  //
  // sensors.js guards a missing *sensor* but not a missing *position*, so
  // formatPosition() calls .split() on null and throws. City.fromApi handles
  // the identical case correctly by returning []. Because no store action has
  // a try/catch, this TypeError escapes as an unhandled rejection and blanks
  // the view.
  //
  // Phase 8 should make this return [] to match city.js; when it does, replace
  // the assertion below with `toEqual([])`.
  it('currently THROWS when position is missing (known bug, see Phase 8)', () => {
    expect(() => Sensor.fromApi({ ...apiSensor, position: null })).toThrow(
      TypeError
    );
    expect(() =>
      Sensor.fromApi({ ...apiSensor, position: undefined })
    ).toThrow(TypeError);
  });
});
