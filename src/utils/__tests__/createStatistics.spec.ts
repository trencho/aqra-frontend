import { describe, expect, it } from 'vitest';

import { at } from '@/__tests__/support/expect';
import { PollutantsLabels } from '@/constants/pollutants';

import type { HistoryBySensorId } from '../createStatistics';
import {
  chartConfig,
  mapHistoryToSeries,
  SERIES_COLORS,
  seriesColor,
} from '../createStatistics';

// Typed, so the fixture is checked against the shape the function declares --
// which is how the `[]`-vs-`{}` default bug that this conversion fixed became
// visible in the first place.
const historyData: HistoryBySensorId = {
  'sensor-1': {
    data: [
      { time: '15/01/2024 10:30', pm10: 42, pm2_5: 21 },
      { time: '15/01/2024 11:30', pm10: 45, pm2_5: 23 },
    ],
  },
};

// `string[] | null` and not PollutantKey[]: one test deliberately passes
// 'not-a-pollutant' to assert it yields an undefined label, and another passes
// null to assert it is treated as empty rather than throwing.
const series = (selectedPollutants: string[] | null) =>
  mapHistoryToSeries({
    sensorId: 'sensor-1',
    historyData,
    selectedPollutants,
  });

/** The nth series, failing clearly if the call produced fewer than expected. */
const seriesAt = (selectedPollutants: string[] | null, index: number) =>
  at(series(selectedPollutants), index);

describe('mapHistoryToSeries', () => {
  it('produces one series per selected pollutant', () => {
    expect(series(['pm10', 'pm2_5'])).toHaveLength(2);
  });

  it('labels each series with its human-readable pollutant name', () => {
    expect(seriesAt(['pm10', 'pm2_5'], 0).label).toBe('PM10');
    expect(seriesAt(['pm10', 'pm2_5'], 1).label).toBe('PM2.5');
  });

  it('extracts the readings for the requested pollutant only', () => {
    expect(seriesAt(['pm10'], 0).data).toEqual([42, 45]);
  });

  it('carries the timestamps alongside the readings', () => {
    expect(seriesAt(['pm10'], 0).time).toEqual([
      '15/01/2024 10:30',
      '15/01/2024 11:30',
    ]);
  });

  it('disables area fill', () => {
    expect(seriesAt(['pm10'], 0).fill).toBe(false);
  });

  it('returns no series when nothing is selected', () => {
    expect(series([])).toEqual([]);
  });

  it('defaults both historyData and selectedPollutants', () => {
    expect(mapHistoryToSeries({ sensorId: 'sensor-1' })).toEqual([]);
  });

  it('yields undefined data for a sensor with no history, without throwing', () => {
    const pm10 = at(
      mapHistoryToSeries({
        sensorId: 'unknown-sensor',
        historyData,
        selectedPollutants: ['pm10'],
      }),
      0
    );

    expect(pm10.data).toBeUndefined();
    expect(pm10.time).toBeUndefined();
  });

  it('gives an unrecognised pollutant an undefined label', () => {
    expect(seriesAt(['not-a-pollutant'], 0).label).toBeUndefined();
  });

  // Regression guards. Colours used to come from
  // '#' + Math.floor(Math.random() * 16777215).toString(16), which meant the
  // same chart never rendered twice the same AND a small random value produced
  // a hex string shorter than six digits -- not a valid CSS colour.
  it('assigns a stable colour for a given series position', () => {
    const colours = new Set(
      Array.from({ length: 40 }, () => seriesAt(['pm10'], 0).borderColor)
    );

    expect(colours.size).toBe(1);
  });

  it('always emits a full six-digit hex colour', () => {
    const all = series(Object.keys(PollutantsLabels));

    for (const s of all) {
      expect(s.borderColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('gives each series in a chart a distinct colour', () => {
    const colours = series(['pm10', 'pm2_5', 'no2']).map((s) => s.borderColor);

    expect(new Set(colours).size).toBe(3);
  });

  it('wraps the palette rather than running out of colours', () => {
    const many = Array.from(
      { length: SERIES_COLORS.length + 2 },
      () => 'pm10'
    );

    const colours = series(many).map((s) => s.borderColor);

    expect(at(colours, SERIES_COLORS.length)).toBe(at(colours, 0));
    expect(colours.every(Boolean)).toBe(true);
  });

  // Regression guard: a default parameter only applies to `undefined`, never
  // to `null` -- and initStatisticPage() sets pollutantInput.value to null, so
  // this used to throw. Only the Show button's :disabled attribute kept it
  // unreachable in the UI.
  it('treats a null pollutant selection as empty rather than throwing', () => {
    expect(series(null)).toEqual([]);
  });

  it('treats null historyData as empty rather than throwing', () => {
    const pm10 = at(
      mapHistoryToSeries({
        sensorId: 'sensor-1',
        historyData: null,
        selectedPollutants: ['pm10'],
      }),
      0
    );

    expect(pm10.data).toBeUndefined();
  });
});

describe('seriesColor', () => {
  it('is stable for a given index', () => {
    expect(seriesColor(0)).toBe(seriesColor(0));
  });

  it('wraps around the palette', () => {
    expect(seriesColor(SERIES_COLORS.length)).toBe(seriesColor(0));
  });

  it('only contains valid six-digit hex colours', () => {
    for (const colour of SERIES_COLORS) {
      expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    }
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
