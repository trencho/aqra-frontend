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

  // Regression guard: this used to throw. formatPosition() called .split() on
  // null one guard away from the `if (!sensor) return null` above, so a sensor
  // with no position took out the whole view -- and with no try/catch anywhere
  // in src/, it surfaced as an unhandled rejection. Now matches city.js.
  it('returns an empty position when it is missing, rather than throwing', () => {
    expect(Sensor.fromApi({ ...apiSensor, position: null }).position).toEqual(
      []
    );
    expect(
      Sensor.fromApi({ ...apiSensor, position: undefined }).position
    ).toEqual([]);
  });
});
