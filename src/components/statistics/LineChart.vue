<template>
  <Line
    :data="chartData"
    :options="options"
  />
</template>

<script>
import { Chart, registerables } from 'chart.js';
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

export default {
  name: 'LineChart',

  components: {
    Line,
  },

  props: {
    chartData: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
  },
};
</script>
