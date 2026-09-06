<template>
  <Line
    :data="chartData"
    :options="options"
  />
</template>

<script lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
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
//
// Seven named pieces, not `...registerables`. The app draws exactly one chart:
// a line chart with a category x-axis, a linear y-axis, the default legend and
// the default hover tooltip.
//
// `registerables` is a value import holding a reference to every controller,
// scale, element and plugin Chart.js ships, so spreading it defeats
// tree-shaking wholesale -- the bundler cannot drop what a live array points
// at. That, not the registry, is why this mattered: naming the seven took
// 41,123 bytes out of the production chunk.
//
// Four are deliberately absent because they were measured to be inert here,
// not because they looked unimportant:
//
//   Filler      every series sets `fill: false` (utils/createStatistics.ts).
//   Colors      it self-skips when any dataset defines borderColor, which
//               every series does via seriesColor(index).
//   Title       `plugins.title.display` defaults to false and nothing sets it.
//   SubTitle    same, and Decimation defaults to disabled.
//
// statistics.spec.ts asserts each of those four is unregistered, so setting
// `fill: true` or asking for a chart title fails a test rather than silently
// doing nothing.
//
// Adding a second chart type means adding its controller here; the failure is
// loud ("<kind> is not a registered controller") rather than a blank canvas.
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
);

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
