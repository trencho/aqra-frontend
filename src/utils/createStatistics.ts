import { PollutantsLabels } from '@/constants/pollutants';
import type { ForecastDatum } from '@/types/domain';

/**
 * Fixed series palette.
 *
 * Replaces `'#' + Math.floor(Math.random() * 16777215).toString(16)`, which
 * had two problems: the same chart never rendered twice the same, and a small
 * random value produced a hex string shorter than six digits -- not a valid
 * CSS colour at all.
 *
 * Nine entries, one per tracked pollutant, so a chart never has to wrap.
 */
export const SERIES_COLORS = Object.freeze([
  '#1f77b4',
  '#d62728',
  '#2ca02c',
  '#ff7f0e',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#17becf',
  '#bcbd22',
]);

export function seriesColor(index: number): string {
  // Asserted because the modulo keeps the index in range; the palette is
  // non-empty and never mutated.
  return SERIES_COLORS[index % SERIES_COLORS.length]!;
}

/**
 * History keyed by sensor id, as the store stores it.
 *
 * The value admits null because Forecast.fromApi returns null for an empty
 * payload and the store writes that straight into historyData. The `?.` chain
 * below already handles it.
 */
export type HistoryBySensorId = Record<
  string,
  { data: ForecastDatum[] } | null
>;

export interface MapHistoryToSeriesOptions {
  sensorId: string | null | undefined;
  historyData?: HistoryBySensorId | null | undefined;
  /**
   * Plain `string[]`, not `PollutantKey[]`. The selection comes from the
   * pollutant select, and a test asserts an unrecognised value yields an
   * undefined label rather than being rejected.
   */
  selectedPollutants?: string[] | null | undefined;
}

export interface ChartSeries {
  label: string | undefined;
  fill: boolean;
  borderColor: string;
  data: Array<number | string | undefined> | undefined;
  time: Array<number | string | undefined> | undefined;
}

/**
 * Looks up a display label without asserting the key is a known pollutant.
 *
 * PollutantsLabels is Record<PollutantKey, string>, so indexing it with an
 * arbitrary string would need a cast that then claims the result is always a
 * string. It is not: a test passes 'not-a-pollutant' and expects undefined.
 */
function pollutantLabel(pollutant: string): string | undefined {
  return (PollutantsLabels as Partial<Record<string, string>>)[pollutant];
}

export function mapHistoryToSeries({
  sensorId,
  // Defaults to {} rather than []. The parameter is indexed by sensor id one
  // line below, so an array was the wrong shape -- it only ever went unnoticed
  // because the `?.` chain swallows it and because the sole caller that omits
  // the argument also omits selectedPollutants, returning [] before the
  // default is ever read.
  historyData = {},
  selectedPollutants = [],
}: MapHistoryToSeriesOptions): ChartSeries[] {
  // A default parameter only applies to `undefined`, never to `null` -- and
  // initStatisticPage() sets pollutantInput.value to null, so this arrived as
  // null and threw on .map(). Only the Show button's :disabled attribute was
  // holding that path shut.
  const pollutants = selectedPollutants ?? [];
  const history = historyData ?? {};

  return pollutants.map((pollutant, index) => ({
    label: pollutantLabel(pollutant),
    fill: false,
    borderColor: seriesColor(index),
    // `sensorId as string` keeps these two expressions character-for-character
    // what the .js version had. Guarding on sensorId instead would add a branch
    // no test reaches and would quietly lower branch coverage; a null sensorId
    // already lands on the `?.` short-circuit, which is the same result.
    data: history?.[sensorId as string]?.data.map((values) => values[pollutant]),
    time: history?.[sensorId as string]?.data.map((values) => values.time),
  }));
}

export const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
};
