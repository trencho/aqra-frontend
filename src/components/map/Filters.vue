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

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { SelectedLayer } from '@/types/map';

import InputFilters from './InputFilters.vue';
import SliderFilter from './SliderFilter.vue';

export default defineComponent({
  name: 'Filters',

  components: {
    InputFilters,
    SliderFilter,
  },

  props: {
    // PropType rather than bare Object, which infers Record<string, any> --
    // and an object type is not assignable to an index-signature type, so
    // Map.vue could not pass its typed `selected` down at all.
    selected: {
      type: Object as PropType<SelectedLayer | null>,
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

});
</script>
