<template>
  <div class="statisticFilters">
    <VSelect
      :label="$t(nameInput.label)"
      class="marginRight10 statisticInput"
      item-text="label"
      item-value="value"
      v-bind="nameInput"
      @change="setValue({
        input: nameInput,
        value: $event
      })"
    />
    <VSelect
      :label="$t(sensorInput.label)"
      class="marginRight10 statisticInput"
      item-text="label"
      item-value="value"
      v-bind="sensorInput"
      @change="setValue({
        input: sensorInput,
        value: $event
      })"
    />
    <VSelect
      :hint="$t('common.pollutantStatisticHelp')"
      :label="$t(pollutantInput.label)"
      class="marginRight10 statisticInput"
      item-text="label"
      item-value="value"
      multiple
      persistent-hint
      v-bind="pollutantInput"
      @change="setValue({
        input: pollutantInput,
        value: $event,
        isStatistics: true
      })"
    />
    <VBtn
      :disabled="!pollutantInput.value"
      class="marginLeft10 marginTop20"
      small
      @click="$emit('show')"
    >
      {{ $t('common.showStatistics') }}
    </VBtn>
  </div>
</template>

<script>
import { mapHistoryToSeries } from '@/utils/createStatistics';
import { mapActions, mapState } from 'vuex';

export default {
  name: 'StatisticsFilter',

  computed: {
    ...mapState('airPollution', [
      'nameInput',
      'historyData',
      'sensorInput',
      'pollutantInput',
    ]),
  },

  methods: {
    ...mapActions('airPollution', ['setValue']),
    async createStatistics() {
      const historyData = mapHistoryToSeries({
        sensorId: this.sensorInput.value,
        historyData: this.historyData,
        selectedPollutants: this.pollutantInput.value
      });

      this.chartOptions.series = historyData;
      this.chartOptions.xAxis.categories = historyData[0].time;
    }
  }
};
</script>