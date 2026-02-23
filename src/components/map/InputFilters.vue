<template>
  <div>
    <VCheckbox
      :input-value="showForAllCitiesInput.value"
      :label="$t(showForAllCitiesInput.label)"
      class="inputFilter"
      dark
      v-bind="showForAllCitiesInput"
      @change="
        $emit('setShowForAllCities', {
          input: showForAllCitiesInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :input-value="showForAllSensorsInput.value"
      :label="$t(showForAllSensorsInput.label)"
      class="inputFilter"
      dark
      v-bind="showForAllSensorsInput"
      @change="
        $emit('setShowForAllSensors', {
          input: showForAllSensorsInput,
          value: $event,
        })
      "
    />
    <VDivider dark class="marginBottom30" />
    <VCheckbox
      :input-value="showCityBoundariesInput.value"
      :label="$t(showCityBoundariesInput.label)"
      class="inputFilter"
      dark
      v-bind="showCityBoundariesInput"
      @change="
        $emit('changeBoundaries', {
          input: showCityBoundariesInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :input-value="showCityMarkersInput.value"
      :label="$t(showCityMarkersInput.label)"
      class="inputFilter"
      dark
      v-bind="showCityMarkersInput"
      @change="
        $emit('changeCityMarkers', {
          input: showCityMarkersInput,
          value: $event,
        })
      "
    />
    <VCheckbox
      :input-value="showSensorMarkersInput.value"
      :label="$t(showSensorMarkersInput.label)"
      class="inputFilter"
      dark
      v-bind="showSensorMarkersInput"
      @change="
        $emit('changeSensorMarkers', {
          input: showSensorMarkersInput,
          value: $event,
        })
      "
    />
    <VSelect
      v-if="!nameInput.hidden"
      :label="$t(nameInput.label)"
      class="inputFilter width250"
      dark
      item-text="label"
      item-value="value"
      v-bind="nameInput"
      @change="
        $emit('setName', {
          input: nameInput,
          value: $event,
        })
      "
    />
    <VSelect
      v-if="!sensorInput.hidden"
      :label="$t(sensorInput.label)"
      class="inputFilter width250"
      dark
      item-text="label"
      item-value="value"
      v-bind="sensorInput"
      @change="
        $emit('setValue', {
          input: sensorInput,
          value: $event,
        })
      "
    />
    <VDivider dark class="marginBottom30" />
    <VSelect
      :hint="$t('common.pollutantHelp')"
      :label="$t(pollutantInput.label)"
      class="inputFilter width250 marginTop24"
      dark
      item-text="label"
      item-value="value"
      persistent-hint
      v-bind="pollutantInput"
      @change="
        $emit('setPollutant', {
          input: pollutantInput,
          value: $event,
        })
      "
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'InputFilters',

  computed: {
    ...mapState('airPollution', [
      'cities',
      'nameInput',
      'sensorInput',
      'pollutantInput',
      'showCityMarkersInput',
      'showForAllCitiesInput',
      'showSensorMarkersInput',
      'showForAllSensorsInput',
      'showCityBoundariesInput',
    ]),
  },
};
</script>
