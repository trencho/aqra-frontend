import { describe, expect, it } from 'vitest';

import { HEAT_GRADIENT, mapOptions } from '@/constants/map';
import { PollutantRatio } from '@/constants/pollutants';
import type { PollutantKey } from '@/types/domain';

import {
  gradientStops,
  heatLegendGradientCss,
  heatLegendLabel,
  heatLegendStops,
} from '../heatLegend';

describe('gradientStops', () => {
  // The bug this guards is not hypothetical. `mapOptions.gradient` is keyed by
  // number-like strings, and JavaScript hoists integer-like keys, so
  // Object.keys returns ['0', '1', '0.2', '0.4', '0.6', '0.8'] -- dark red
  // second. A legend built in that order is wrong and looks deliberate.
  it('sorts numerically, not in Object.keys order', () => {
    expect(Object.keys(HEAT_GRADIENT)).toEqual([
      '0',
      '1',
      '0.2',
      '0.4',
      '0.6',
      '0.8',
    ]);

    expect(gradientStops().map((s) => s.offset)).toEqual([
      0, 0.2, 0.4, 0.6, 0.8, 1,
    ]);
  });

  // Derived, never restated. If someone edits a colour in constants/map.ts the
  // legend has to follow, or it explains a map that no longer looks like it.
  it('takes its colours from the ramp the heatmap is given', () => {
    expect(gradientStops()).toEqual(
      [0, 0.2, 0.4, 0.6, 0.8, 1].map((offset) => ({
        offset,
        color: HEAT_GRADIENT[offset],
      }))
    );
  });

  // The single-source property, asserted structurally rather than by comparing
  // two lists that happen to match. `toBe`, so this fails if anyone ever
  // inlines a second gradient literal into mapOptions -- at which point the
  // legend and the map could drift while every value-equality test stayed
  // green.
  it('is the same object the heatmap options carry', () => {
    expect(mapOptions.gradient).toBe(HEAT_GRADIENT);
  });
});

describe('heatLegendStops', () => {
  // createMap.ts computes intensity as `reading / PollutantRatio[pollutant]`,
  // so offset 1.0 is a reading of exactly that divisor.
  it('turns each offset back into the reading that produces it', () => {
    expect(heatLegendStops('so2').map((s) => s.value)).toEqual([
      0, 250, 500, 750, 1000, 1250,
    ]);
  });

  it('scales per pollutant, which is the whole point of showing it', () => {
    // The extremes of PollutantRatio, a factor of 1250 apart. Same six colours,
    // completely different readings -- and before this legend the UI said
    // nothing about which scale was in force.
    expect(heatLegendStops('nh3').map((s) => s.value)).toEqual([
      0, 0.2, 0.4, 0.6, 0.8, 1,
    ]);
    expect(heatLegendStops('so2').at(-1)?.value).toBe(1250);
    expect(heatLegendStops('nh3').at(-1)?.value).toBe(1);
  });

  // The rounding in heatLegendStops is a guard, not a fix, and this test says
  // so rather than claiming a bug it does not have. The first draft asserted
  // `0.2 * PollutantRatio.aqi` is not 6 -- it is exactly 6, and the assertion
  // failed. Checked across all nine divisors and all six offsets: not one of
  // the 54 products is inexact today, because every divisor is an integer and
  // the offsets are fifths.
  //
  // What the rounding protects is the next non-integer divisor added to
  // PollutantRatio, where a raw product renders as 6.000000000000001 in a
  // label. Asserted here as "every stop is a clean number", which holds now and
  // keeps holding then.
  it('yields clean numbers for every current divisor', () => {
    expect(heatLegendStops('aqi').map((s) => s.value)).toEqual([
      0, 6, 12, 18, 24, 30,
    ]);

    (Object.keys(PollutantRatio) as PollutantKey[]).forEach((p) => {
      heatLegendStops(p).forEach(({ value }) => {
        expect(Math.round(value * 100) / 100).toBe(value);
      });
    });
  });

  it('tops out at the pollutant divisor for every pollutant', () => {
    const pollutants = Object.keys(PollutantRatio) as PollutantKey[];

    // Nine of them, so a pollutant added without a divisor fails here rather
    // than rendering a NaN label.
    expect(pollutants).toHaveLength(9);
    pollutants.forEach((p) => {
      const stops = heatLegendStops(p);
      expect(stops).toHaveLength(6);
      expect(stops.at(-1)?.value).toBe(PollutantRatio[p]);
      expect(stops[0]?.value).toBe(0);
      expect(stops.every((s) => Number.isFinite(s.value))).toBe(true);
    });
  });

  it('carries the colour alongside the value', () => {
    expect(heatLegendStops('pm10')[0]).toEqual({
      offset: 0,
      color: '#2a962c',
      value: 0,
    });
  });
});

describe('heatLegendGradientCss', () => {
  it('reproduces the ramp left to right, low to high', () => {
    expect(heatLegendGradientCss()).toBe(
      'linear-gradient(to right, #2a962c 0%, #48f04b 20%, #fcf40a 40%, ' +
        '#e69b05 60%, #f73302 80%, #ad0000 100%)'
    );
  });
});

describe('heatLegendLabel', () => {
  it('uses the same display form as the select and the chart', () => {
    expect(heatLegendLabel('pm2_5')).toBe('PM2.5');
    expect(heatLegendLabel('no2')).toBe('NO2');
  });
});
