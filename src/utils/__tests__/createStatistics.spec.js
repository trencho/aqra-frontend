import { describe, it, expect } from 'vitest';
import { mapHistoryToSeries, chartConfig } from '../createStatistics';

const historyData = {
  'sensor-1': {
    data: [
      { time: '15/01/2024 10:30', pm10: 42, pm2_5: 21 },
      { time: '15/01/2024 11:30', pm10: 45, pm2_5: 23 },
    ],
  },
};

const series = (selectedPollutants) =>
  mapHistoryToSeries({
    sensorId: 'sensor-1',
    historyData,
    selectedPollutants,
  });

describe('mapHistoryToSeries', () => {
  it('produces one series per selected pollutant', () => {
    expect(series(['pm10', 'pm2_5'])).toHaveLength(2);
  });

  it('labels each series with its human-readable pollutant name', () => {
    const [pm10, pm25] = series(['pm10', 'pm2_5']);

    expect(pm10.label).toBe('PM10');
    expect(pm25.label).toBe('PM2.5');
  });

  it('extracts the readings for the requested pollutant only', () => {
    const [pm10] = series(['pm10']);

    expect(pm10.data).toEqual([42, 45]);
  });

  it('carries the timestamps alongside the readings', () => {
    const [pm10] = series(['pm10']);

    expect(pm10.time).toEqual(['15/01/2024 10:30', '15/01/2024 11:30']);
  });

  it('disables area fill', () => {
    expect(series(['pm10'])[0].fill).toBe(false);
  });

  it('returns no series when nothing is selected', () => {
    expect(series([])).toEqual([]);
  });

  it('defaults both historyData and selectedPollutants', () => {
    expect(mapHistoryToSeries({ sensorId: 'sensor-1' })).toEqual([]);
  });

  it('yields undefined data for a sensor with no history, without throwing', () => {
    const [pm10] = mapHistoryToSeries({
      sensorId: 'unknown-sensor',
      historyData,
      selectedPollutants: ['pm10'],
    });

    expect(pm10.data).toBeUndefined();
    expect(pm10.time).toBeUndefined();
  });

  it('gives an unrecognised pollutant an undefined label', () => {
    expect(series(['not-a-pollutant'])[0].label).toBeUndefined();
  });

  // CHARACTERIZATION TESTS -- pins a known defect, not desired behaviour.
  //
  // createStatistics.js:11 picks colours with Math.random(), which has two
  // problems: the same chart never renders twice the same (so it cannot be
  // snapshot-tested), and when the random value is small the hex string is
  // shorter than 6 digits and is not a valid CSS colour at all.
  //
  // Phase 8 replaces this with a fixed palette indexed by series position.
  // When it does, replace these two tests with an exact-colour assertion.
  it('currently assigns a RANDOM borderColor (see Phase 8)', () => {
    const colours = new Set(
      Array.from({ length: 40 }, () => series(['pm10'])[0].borderColor)
    );

    // With 40 draws over 16.7M values, collisions are vanishingly unlikely.
    expect(colours.size).toBeGreaterThan(1);
  });

  it('can emit a malformed short hex colour (see Phase 8)', () => {
    // Every colour starts with '#', but the digit count is not guaranteed to
    // be 6 -- that is precisely the bug.
    const colour = series(['pm10'])[0].borderColor;

    expect(colour).toMatch(/^#[0-9a-f]{1,6}$/);
  });
});

describe('chartConfig', () => {
  it('is responsive and does not preserve aspect ratio', () => {
    // maintainAspectRatio: false is what lets the chart fill its container
    // height; flipping it silently collapses the chart.
    expect(chartConfig).toEqual({
      responsive: true,
      maintainAspectRatio: false,
    });
  });
});
