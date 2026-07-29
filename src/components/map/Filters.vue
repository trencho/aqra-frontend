<template>
  <div class="filters">
    <div>
      {{ $t('common.filters') }}
      <VDivider class="marginTop12 marginBottom30" />
      <InputFilters
        class="flex flex1 filterInputs"
        @setName="$emit('setName', $event)"
        @setValue="$emit('setValue', $event)"
        @setPollutant="$emit('setPollutant', $event)"
        @changeBoundaries="$emit('changeBoundaries', $event)"
        @changeCityMarkers="$emit('changeCityMarkers', $event)"
        @changeSensorMarkers="$emit('changeSensorMarkers', $event)"
        @setShowForAllCities="$emit('setShowForAllCities', $event)"
        @setShowForAllSensors="$emit('setShowForAllSensors', $event)"
      />
    </div>
    <SliderFilter
      class="flex1"
      :selected="selected"
      @sliderChange="$emit('sliderChange', $event)"
    />
  </div>
</template>

<script>
import InputFilters from './InputFilters.vue';
import SliderFilter from './SliderFilter.vue';

export default {
  name: 'Filters',

  components: {
    InputFilters,
    SliderFilter,
  },

  props: {
    selected: {
      type: Object,
      default: null,
    },
  },

  emits: [
    'setName',
    'setValue',
    'setPollutant',
    'changeBoundaries',
    'changeCityMarkers',
    'changeSensorMarkers',
    'setShowForAllCities',
    'setShowForAllSensors',
    'sliderChange',
  ],

};
</script>
