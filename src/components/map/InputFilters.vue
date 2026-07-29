<template>
  <div>
    <VCheckbox
      :model-value="store.showForAllCitiesInput.value"
      :label="$t(store.showForAllCitiesInput.label)"
      class="inputFilter"
      @update:model-value="
        $emit('setShowForAllCities', {
          input: store.showForAllCitiesInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :model-value="store.showForAllSensorsInput.value"
      :label="$t(store.showForAllSensorsInput.label)"
      class="inputFilter"
      @update:model-value="
        $emit('setShowForAllSensors', {
          input: store.showForAllSensorsInput,
          value: $event,
        })
      "
    />
    <VDivider class="marginBottom30" />
    <VCheckbox
      :model-value="store.showCityBoundariesInput.value"
      :label="$t(store.showCityBoundariesInput.label)"
      class="inputFilter"
      @update:model-value="
        $emit('changeBoundaries', {
          input: store.showCityBoundariesInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :model-value="store.showCityMarkersInput.value"
      :label="$t(store.showCityMarkersInput.label)"
      class="inputFilter"
      @update:model-value="
        $emit('changeCityMarkers', {
          input: store.showCityMarkersInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :model-value="store.showSensorMarkersInput.value"
      :label="$t(store.showSensorMarkersInput.label)"
      class="inputFilter"
      @update:model-value="
        $emit('changeSensorMarkers', {
          input: store.showSensorMarkersInput,
          value: $event,
        })
      "
    />
    <VSelect
      v-if="!store.nameInput.hidden"
      :model-value="store.nameInput.value"
      :items="store.nameInput.items"
      :label="$t(store.nameInput.label)"
      class="inputFilter width250"
      item-title="label"
      item-value="value"
      @update:model-value="
        $emit('setName', {
          input: store.nameInput,
          value: $event,
        })
      "
    />
    <VSelect
      v-if="!store.sensorInput.hidden"
      :model-value="store.sensorInput.value"
      :items="store.sensorInput.items"
      :label="$t(store.sensorInput.label)"
      class="inputFilter width250"
      item-title="label"
      item-value="value"
      @update:model-value="
        $emit('setValue', {
          input: store.sensorInput,
          value: $event,
        })
      "
    />
    <VDivider class="marginBottom30" />
    <VSelect
      :model-value="store.pollutantInput.value"
      :items="store.pollutantInput.items"
      :hint="$t('common.pollutantHelp')"
      :label="$t(store.pollutantInput.label)"
      class="inputFilter width250 marginTop24"
      item-title="label"
      item-value="value"
      persistent-hint
      @update:model-value="
        $emit('setPollutant', {
          input: store.pollutantInput,
          value: $event,
        })
      "
    />
  </div>
</template>

<script>
import { mapStores } from 'pinia';
import { useAirPollutionStore } from '@/stores/airPollution';

export default {
  name: 'InputFilters',

  // Vue 3 warns about undeclared emits, and an undeclared event also falls
  // through to the root element as a native listener.
  emits: [
    'setName',
    'setValue',
    'setPollutant',
    'changeBoundaries',
    'changeCityMarkers',
    'changeSensorMarkers',
    'setShowForAllCities',
    'setShowForAllSensors',
  ],

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },
  },
};
</script>
