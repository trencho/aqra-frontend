import { describe, it, expect } from 'vitest';
import {
  Pollutants,
  PollutantsLabels,
  PollutantRatio,
} from '../pollutants';

const POLLUTANT_KEYS = [
  'aqi',
  'co',
  'nh3',
  'no',
  'no2',
  'o3',
  'pm2_5',
  'pm10',
  'so2',
];

describe('Pollutants', () => {
  it('lists the nine tracked pollutants', () => {
    expect(Object.keys(Pollutants).sort()).toEqual([...POLLUTANT_KEYS].sort());
  });

  it('maps each key to itself, so the key is the API value', () => {
    for (const key of POLLUTANT_KEYS) {
      expect(Pollutants[key]).toBe(key);
    }
  });
});

describe('PollutantsLabels', () => {
  it('covers every pollutant — a missing entry renders an undefined chart label', () => {
    for (const key of POLLUTANT_KEYS) {
      expect(PollutantsLabels[key]).toBeTypeOf('string');
      expect(PollutantsLabels[key].length).toBeGreaterThan(0);
    }
  });

  it('uses the conventional display forms', () => {
    expect(PollutantsLabels.pm2_5).toBe('PM2.5');
    expect(PollutantsLabels.pm10).toBe('PM10');
    expect(PollutantsLabels.aqi).toBe('AQI');
    expect(PollutantsLabels.no2).toBe('NO2');
  });

  it('has no entries beyond the known pollutants', () => {
    expect(Object.keys(PollutantsLabels).sort()).toEqual(
      [...POLLUTANT_KEYS].sort()
    );
  });
});

describe('PollutantRatio', () => {
  it('covers every pollutant — a missing ratio breaks heatmap intensity', () => {
    for (const key of POLLUTANT_KEYS) {
      expect(PollutantRatio[key]).toBeTypeOf('number');
    }
  });

  it('uses positive divisors — a zero would produce Infinity intensity', () => {
    for (const key of POLLUTANT_KEYS) {
      expect(PollutantRatio[key]).toBeGreaterThan(0);
    }
  });

  it('has no entries beyond the known pollutants', () => {
    expect(Object.keys(PollutantRatio).sort()).toEqual(
      [...POLLUTANT_KEYS].sort()
    );
  });
});
