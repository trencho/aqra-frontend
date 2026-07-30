<template>
  <Line
    :data="chartData"
    :options="options"
  />
</template>

<script lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { Line } from 'vue-chartjs';

// Chart.js 3+ is tree-shakeable: without registering the controllers, scales
// and elements, every chart throws "line is not a registered controller" at
// render time. Nothing in this project ever registered them, which was half
// the reason the Statistics tab has never drawn.
//
// The other half was this component: it used the vue-chartjs v2/v3 API
// (`extends: Line` plus `this.renderChart(...)`) against vue-chartjs 5, where
// Line is a component taking `data`/`options` props and renderChart no longer
// exists.
Chart.register(...registerables);

export default defineComponent({
  name: 'LineChart',

  components: {
    Line,
  },

  // `type: Object` alone infers Record<string, any>, which the wrapped Line
  // component rejects -- it wants a ChartData with a `datasets` array. PropType
  // narrows the runtime validator's Object to the real chart shape.
  props: {
    chartData: {
      type: Object as PropType<ChartData<'line'>>,
      required: true,
    },
    options: {
      type: Object as PropType<ChartOptions<'line'>>,
      required: true,
    },
  },
});
</script>
