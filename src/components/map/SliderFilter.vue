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
        {{ selected && selected.selectedTime![modelValue] }}
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

<script lang="ts">
import { mapStores } from 'pinia';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import { useAirPollutionStore } from '@/stores/airPollution';
import type { SelectedLayer } from '@/types/map';

export default defineComponent({
  name: 'SliderFilter',

  props: {
    drawer: Boolean,
    // PropType rather than bare Object: the template reads
    // `selected.selectedTime[modelValue]`, which an untyped Record<string, any>
    // would not check at all.
    selected: {
      type: Object as PropType<SelectedLayer | null>,
      default: null,
    },
  },

  emits: ['sliderChange'],

  data() {
    return {
      slider: 0,
      // Annotated because `null` alone infers the type `null`, and playSlider
      // assigns a timer handle to it.
      //
      // `number` rather than ReturnType<typeof setInterval>: both the DOM and
      // Node type definitions are in scope, and Node's `Timeout` is a class, so
      // Vue's reactive typing rebuilds it structurally and it stops matching
      // clearInterval's parameter. The browser handle is a number, which survives
      // that intact.
      interval: null as number | null,
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
    // Cast, not a guard: clearInterval's signature takes a handle or undefined,
    // never null, but calling it with null is a harmless no-op and is what this
    // has always done. A guard would add a branch no test reaches.
    clearInterval(this.interval as number);
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
    sliderChange(time: number) {
      this.$emit('sliderChange', time);
    },
    playSlider() {
      this.isPlaying = !this.isPlaying;

      if (this.isPlaying) {
        this.interval = setInterval(this.increment, 500) as unknown as number;
      } else {
        // Cast, not a guard: clearInterval's signature takes a handle or
      // undefined, never null, but calling it with null is a harmless no-op and
      // is what this code has always done. A guard would add an untested branch.
      clearInterval(this.interval as number);
      }
    },
  },
});
</script>
