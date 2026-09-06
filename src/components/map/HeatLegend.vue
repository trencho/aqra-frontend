<template>
  <!--
    role="img" with a name that states the whole scale, because the bar itself
    is a gradient and the tick labels are separate text nodes: read linearly a
    screen reader would announce six bare numbers with nothing tying them to a
    colour or a pollutant. The visible labels stay for sighted users; this is
    the same information said once, in a sentence.
  -->
  <div
    class="heatLegend"
    role="img"
    :aria-label="ariaLabel"
  >
    <div class="heatLegendTitle">
      {{ $t('common.legend') }} &mdash; {{ pollutantLabel }}
    </div>
    <div
      class="heatLegendBar"
      :style="{ background: gradient }"
    />
    <div
      class="heatLegendTicks"
      aria-hidden="true"
    >
      <span
        v-for="stop in stops"
        :key="stop.offset"
        class="heatLegendTick"
      >
        {{ stop.value }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { PollutantKey } from '@/types/domain';
import {
  heatLegendGradientCss,
  heatLegendLabel,
  heatLegendMax,
  heatLegendStops,
} from '@/utils/heatLegend';

/**
 * The scale for the heatmap.
 *
 * The map paints a six-stop gradient and divides each reading by a per-pollutant
 * divisor to decide what counts as full intensity. Those divisors span a factor
 * of 1250 -- nh3 saturates at a reading of 1, so2 at 1250 -- so the same red
 * meant something different depending on the select, and nothing on screen said
 * which scale was in force.
 *
 * Every number and colour here is derived from the constants the map itself
 * reads (see utils/heatLegend.ts). Nothing is restated, so the legend cannot
 * drift from what is painted.
 */
export default defineComponent({
  name: 'HeatLegend',

  props: {
    /**
     * Required, and the parent renders this only once a pollutant is chosen --
     * which is also the only time a heat layer exists. A nullable prop with an
     * internal `v-if` would put that decision in two places.
     */
    pollutant: {
      type: String as PropType<PollutantKey>,
      required: true,
    },
  },

  computed: {
    stops() {
      return heatLegendStops(this.pollutant);
    },

    gradient() {
      return heatLegendGradientCss();
    },

    pollutantLabel() {
      return heatLegendLabel(this.pollutant);
    },

    ariaLabel(): string {
      // heatLegendMax rather than stops.at(-1), which is never undefined here
      // but types as though it might, leaving a `?? 0` branch no test can
      // reach and no reader can justify.
      return `${this.$t('common.legend')} ${this.pollutantLabel}: 0 to ${heatLegendMax(this.pollutant)}`;
    },
  },
});
</script>
