import { PollutantsLabels } from '@/constants/pollutants';

export function mapHistoryToSeries({
  sensorId,
  historyData = [],
  selectedPollutants = [],
}) {
  return selectedPollutants.map((pollutant) => ({
    label: PollutantsLabels[pollutant],
    fill: false,
    borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
    data: historyData?.[sensorId]?.data.map(
      (pollutants) => pollutants[pollutant]
    ),
    time: historyData?.[sensorId]?.data.map((pollutants) => pollutants.time),
  }));
}

export const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
};
