<template>
  <div
    :style="'min-height: calc(100vh - ' + $vuetify.application.top + 'px); width: 100%, z-index=1'"
  >
    <StatisticsFilters
      @show="createStatistics"
    />
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
import LineChart from './LineChart.vue';
import StatisticsFilters from './StatisticFilters.vue';

import {mapActions, mapState} from 'vuex';
import {chartConfig, mapHistoryToSeries} from '@/utils/createStatistics';

export default {
  name: 'Statistics',

  components: {
    LineChart,
    StatisticsFilters
  },

  data() {
    return {
      chartData: {
        datasets: []
      },
      chartOptions: chartConfig
    }
  },

  computed: {
    ...mapState('airPollution', [
      'nameInput',
      'historyData',
      'sensorInput',
      'pollutantInput',
    ]),
  },

  async beforeMount() {
    await this.initStatisticPage();
  },

  methods: {
    ...mapActions('airPollution', ['initStatisticPage', 'setValue']),
    async createStatistics() {
      const historyData = mapHistoryToSeries({
        sensorId: this.sensorInput.value,
        historyData: this.historyData,
        selectedPollutants: this.pollutantInput.value
      });

      this.chartData = {
        datasets: historyData,
        labels: historyData[0].time
      };
    },
  }
};
</script>