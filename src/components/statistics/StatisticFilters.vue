<template>
  <div class="statisticFilters">
    <VSelect
      :model-value="store.nameInput.value"
      :items="store.nameInput.items"
      :label="$t(store.nameInput.label)"
      class="marginRight10 statisticInput"
      item-title="label"
      item-value="value"
      @update:model-value="
        store.setValue({
          input: store.nameInput,
          value: $event,
        })
      "
    />
    <VSelect
      :model-value="store.sensorInput.value"
      :items="store.sensorInput.items"
      :label="$t(store.sensorInput.label)"
      class="marginRight10 statisticInput"
      item-title="label"
      item-value="value"
      @update:model-value="
        store.setValue({
          input: store.sensorInput,
          value: $event,
        })
      "
    />
    <VSelect
      :model-value="store.pollutantInput.value"
      :items="store.pollutantInput.items"
      :hint="$t('common.pollutantStatisticHelp')"
      :label="$t(store.pollutantInput.label)"
      class="marginRight10 statisticInput"
      item-title="label"
      item-value="value"
      multiple
      persistent-hint
      @update:model-value="
        store.setValue({
          input: store.pollutantInput,
          value: $event,
          isStatistics: true,
        })
      "
    />
    <VBtn
      :disabled="!store.pollutantInput.value"
      class="marginLeft10 marginTop20"
      size="small"
      @click="$emit('show')"
    >
      {{ $t('common.showStatistics') }}
    </VBtn>
  </div>
</template>

<script>
import { mapStores } from 'pinia';
import { useAirPollutionStore } from '@/stores/airPollution';

export default {
  name: 'StatisticsFilter',

  emits: ['show'],

  // NOTE: a createStatistics() method used to live here and was dead --
  // Statistics.vue's `@show="createStatistics"` binds the PARENT's method of
  // the same name, so this copy was never reachable. It also assigned
  // this.chartOptions.series on a component with no data(), in Highcharts
  // shape, and would have thrown had anything called it. Phase 8 formally
  // records the removal; it is dropped here because carrying it through the
  // migration would mean porting code that is already unreachable.

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },
  },
};
</script>
