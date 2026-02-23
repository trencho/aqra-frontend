<template>
  <div :style="'height: 100%'">
    <VSlider
      v-model="slider"
      class="slider"
      :disabled="!sliderValid"
      max="23"
      min="0"
      thumb-label="always"
      tick-size="24"
      track-color="white"
      track-fill-color="white"
      vertical
      @change="sliderChange"
    >
      <template #thumb-label="{ value }">
        {{ selected && selected.selectedTime[value] }}
      </template>
      <template #prepend>
        <v-icon color="white" @click="decrement"> mdi-minus </v-icon>
      </template>

      <template #append>
        <div class="sliderButtons">
          <VBtn
            :disabled="!sliderValid"
            depressed
            fab
            x-small
            @click="playSlider"
          >
            <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
          </VBtn>
          <v-icon color="white" @click="increment"> mdi-plus </v-icon>
        </div>
      </template>
    </VSlider>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SliderFilter',

  props: {
    drawer: Boolean,
    selected: {
      type: Object,
    },
  },

  data() {
    return {
      slider: 0,
      interval: null,
      isPlaying: false,
    };
  },

  computed: {
    ...mapState('airPollution', ['pollutantInput']),
    sliderValid() {
      return !!this.pollutantInput.value;
    },
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
