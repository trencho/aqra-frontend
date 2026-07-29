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

<script>
import { mapStores } from 'pinia';

import LineChart from './LineChart.vue';
import StatisticsFilters from './StatisticFilters.vue';

import { useAirPollutionStore } from '@/stores/airPollution';
import { chartConfig, mapHistoryToSeries } from '@/utils/createStatistics';
import { belowAppBar } from '@/constants/layout';

export default {
  name: 'Statistics',

  components: {
    LineChart,
    StatisticsFilters,
  },

  data() {
    return {
      chartData: {
        datasets: [],
      },
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
        sensorId: this.store.sensorInput.value,
        historyData: this.store.historyData,
        selectedPollutants: this.store.pollutantInput.value,
      });

      this.chartData = {
        datasets: historyData,
        // historyData is empty when no pollutant resolved to a series;
        // indexing [0] unguarded threw here.
        labels: historyData[0]?.time ?? [],
      };
    },
  },
};
</script>
