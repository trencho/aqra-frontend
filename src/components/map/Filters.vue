<template>
  <div class="filters">
    <div>
      {{ $t('common.filters') }}
      <VDivider
        dark
        class="marginTop12 marginBottom30"
      />
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
import InputFilters from './InputFilters';
import SliderFilter from './SliderFilter';

export default {
  name: 'Filters',

  components: {
    InputFilters,
    SliderFilter
  },

  props: {
    selected: {
      type: Object
    }
  },

  data() {
    return {
      drawer: true,
    }
  },

  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    }
  }
};
</script>