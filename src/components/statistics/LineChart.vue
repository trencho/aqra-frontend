<script>
  import { Line } from 'vue-chartjs';

  export default {
    name: 'LineChart',
    extends: Line,
    props: {
      options: {
        type: Object,
        required: true
      },
      chartData: {
        type: Object,
        required: true
      },
    },
    watch: {
      options: {
        handler() {
          this.renderChart(this.chartData, this.options);
        }
      },
      chartData: {
        handler() {
          this.renderChart(this.chartData, this.options);
        }
      },
    },

    mounted() {
      this.renderChart(this.chartData, this.options);
    }
  };
</script>
