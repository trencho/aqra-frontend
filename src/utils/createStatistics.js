import { PollutantsLabels } from '@/constants/pollutants';

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

export function seriesColor(index) {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export function mapHistoryToSeries({
  sensorId,
  historyData = [],
  selectedPollutants = [],
}) {
  // A default parameter only applies to `undefined`, never to `null` -- and
  // initStatisticPage() sets pollutantInput.value to null, so this arrived as
  // null and threw on .map(). Only the Show button's :disabled attribute was
  // holding that path shut.
  const pollutants = selectedPollutants ?? [];
  const history = historyData ?? {};

  return pollutants.map((pollutant, index) => ({
    label: PollutantsLabels[pollutant],
    fill: false,
    borderColor: seriesColor(index),
    data: history?.[sensorId]?.data.map((values) => values[pollutant]),
    time: history?.[sensorId]?.data.map((values) => values.time),
  }));
}

export const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
};
