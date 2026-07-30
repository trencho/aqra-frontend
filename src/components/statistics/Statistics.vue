<template>
  <div :style="containerStyle">
    <StatisticsFilters @show="createStatistics" />
    <LineChart
      v-if="chartData.datasets.length"
      class="statisticBar"
      :chart-data="chartData"
      :options="chartOptions"
      :height="500"
    />
  </div>
</template>

<script lang="ts">
import type { ChartData } from 'chart.js';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';

import { belowAppBar } from '@/constants/layout';
import { useAirPollutionStore } from '@/stores/airPollution';
import { chartConfig, mapHistoryToSeries } from '@/utils/createStatistics';

import LineChart from './LineChart.vue';
import StatisticsFilters from './StatisticFilters.vue';

export default defineComponent({
  name: 'Statistics',

  components: {
    LineChart,
    StatisticsFilters,
  },

  // `datasets: []` infers never[], so createStatistics could not assign real
  // series back into it.
  //
  // Asserted to chart.js's ChartData, which LineChart's prop declares, because
  // our ChartSeries is not a ChartDataset: it carries an extra `time` array and
  // looser value types. Chart.js accepts it at runtime -- this is what the
  // Statistics tab has always passed -- so the mismatch is pre-existing and the
  // assertion records it rather than reshaping the series.
  //
  // The initial value stays exactly `{ datasets: [] }` with no `labels` key;
  // adding one would change what the component specs observe.
  data() {
    return {
      chartData: { datasets: [] } as unknown as ChartData<'line'>,
      chartOptions: chartConfig,
    };
  },

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },
    containerStyle() {
      return {
        minHeight: belowAppBar(),
        width: '100%',
        zIndex: 1,
      };
    },
  },

  async beforeMount() {
    await this.store.initStatisticPage();
  },

  methods: {
    async createStatistics() {
      const historyData = mapHistoryToSeries({
        // `as string` / `as string[]`: sensorInput is single-valued and the
        // Statistics pollutant select carries `multiple`, so on this page these
        // arities are fixed. The store types both as the union of what the Map
        // and Statistics pages put there -- see SelectFilterInput.
        sensorId: this.store.sensorInput.value as string,
        historyData: this.store.historyData,
        selectedPollutants: this.store.pollutantInput.value as string[],
      });

      this.chartData = {
        datasets: historyData,
        // historyData is empty when no pollutant resolved to a series;
        // indexing [0] unguarded threw here.
        labels: historyData[0]?.time ?? [],
      } as unknown as ChartData<'line'>;
    },
  },
});
</script>
