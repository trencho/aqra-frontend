import { HEAT_GRADIENT } from '@/constants/map';
import { PollutantRatio, PollutantsLabels } from '@/constants/pollutants';
import type { PollutantKey } from '@/types/domain';

export interface LegendStop {
  /** Gradient position, 0..1. */
  offset: number;
  /** The colour the heatmap paints at this position. */
  color: string;
  /** The reading that produces this position, for the selected pollutant. */
  value: number;
}

/**
 * Read the gradient stops out of the ramp the heatmap is actually given.
 *
 * Derived from `HEAT_GRADIENT`, which `mapOptions.gradient` also points at --
 * one object, not two that agree. A legend holding its own copy of six colours
 * is a legend that can disagree with the map it explains, which is the one
 * failure this whole feature exists to prevent.
 *
 * **Sorted numerically, and that is load-bearing.** `mapOptions.gradient` is an
 * object keyed by number-like strings, and JavaScript orders integer-like keys
 * before the rest in insertion order -- so `Object.keys` returns
 * `['0', '1', '0.2', '0.4', '0.6', '0.8']`. Iterating in that order paints dark
 * red second and yields a legend that is wrong in a way that looks deliberate.
 */
export function gradientStops(): Array<{ offset: number; color: string }> {
  return Object.entries(HEAT_GRADIENT)
    .map(([offset, color]) => ({ offset: Number(offset), color: String(color) }))
    .sort((a, b) => a.offset - b.offset);
}

/**
 * Round away float artifacts without inventing precision.
 *
 * Defensive, not corrective: all 54 products of the nine current divisors and
 * the six offsets are already exact, because every divisor is an integer and
 * the offsets are fifths. This is here for the first divisor that is not, where
 * a raw product would render in a label as 6.000000000000001.
 *
 * Two decimals suits every divisor in PollutantRatio today -- the smallest is
 * 1, whose stops are 0.2 apart. A divisor below about 0.05 would round its
 * lower stops together, which is a reason to revisit this rather than a reason
 * to widen it now.
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The legend for one pollutant: colour, position and the reading behind it.
 *
 * A gradient offset is a reading divided by `PollutantRatio[pollutant]` (see
 * createMap.ts), so offset 1.0 is a reading of exactly that divisor. Those
 * divisors span a factor of 1250 -- nh3 saturates the scale at 1, so2 at 1250 --
 * so the same colour means wildly different things depending on the select, and
 * nothing in the UI said so.
 */
export function heatLegendStops(pollutant: PollutantKey): LegendStop[] {
  const ratio = PollutantRatio[pollutant];

  return gradientStops().map((stop) => ({
    ...stop,
    value: round(stop.offset * ratio),
  }));
}

/**
 * A CSS `linear-gradient` reproducing the heatmap's own ramp.
 *
 * `to right` so the bar reads low-to-high in the same direction as the labels.
 */
export function heatLegendGradientCss(): string {
  const stops = gradientStops()
    .map((s) => `${s.color} ${s.offset * 100}%`)
    .join(', ');

  return `linear-gradient(to right, ${stops})`;
}

/**
 * The reading at full intensity: offset 1.0 times the divisor is the divisor.
 *
 * Exists so callers needing only the top of the scale do not have to index the
 * last element of heatLegendStops and handle an `undefined` that cannot occur.
 */
export function heatLegendMax(pollutant: PollutantKey): number {
  return PollutantRatio[pollutant];
}

/** Display form of the pollutant the legend is describing. */
export function heatLegendLabel(pollutant: PollutantKey): string {
  return PollutantsLabels[pollutant];
}
