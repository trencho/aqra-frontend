<template>
  <div style="height: 100%">
    <VSlider
      v-model="slider"
      class="slider"
      :disabled="!sliderValid"
      :max="23"
      :min="0"
      :step="1"
      thumb-label="always"
      track-color="white"
      track-fill-color="white"
      direction="vertical"
      @update:model-value="sliderChange"
    >
      <template #thumb-label="{ modelValue }">
        {{ selected && selected.selectedTime[modelValue] }}
      </template>
      <template #prepend>
        <VIcon
          color="white"
          @click="decrement"
        >
          mdi-minus
        </VIcon>
      </template>

      <template #append>
        <div class="sliderButtons">
          <VBtn
            :disabled="!sliderValid"
            variant="flat"
            icon
            size="x-small"
            @click="playSlider"
          >
            <VIcon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</VIcon>
          </VBtn>
          <VIcon
            color="white"
            @click="increment"
          >
            mdi-plus
          </VIcon>
        </div>
      </template>
    </VSlider>
  </div>
</template>

<script>
import { mapStores } from 'pinia';

import { useAirPollutionStore } from '@/stores/airPollution';

export default {
  name: 'SliderFilter',

  props: {
    drawer: Boolean,
    selected: {
      type: Object,
      default: null,
    },
  },

  emits: ['sliderChange'],

  data() {
    return {
      slider: 0,
      interval: null,
      isPlaying: false,
    };
  },

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },
    sliderValid() {
      return !!this.store.pollutantInput.value;
    },
  },

  // playSlider starts a setInterval that nothing used to stop. Leaving
  // playback running and switching tabs unmounted the component while the
  // timer kept firing against a dead instance, forever.
  beforeUnmount() {
    clearInterval(this.interval);
  },

  methods: {
    decrement() {
      this.sliderChange(this.slider--);
    },
    increment() {
      if (this.slider === 23) {
        this.slider = 0;
        return;
      }

      this.sliderChange(this.slider++);
    },
    sliderChange(time) {
      this.$emit('sliderChange', time);
    },
    playSlider() {
      this.isPlaying = !this.isPlaying;

      if (this.isPlaying) {
        this.interval = setInterval(this.increment, 500);
      } else {
        clearInterval(this.interval);
      }
    },
  },
};
</script>
