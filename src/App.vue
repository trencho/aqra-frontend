<template>
  <VApp :class="$style.application">
    <HomePage />
  </VApp>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import HomePage from './components/home/HomePage.vue';

export default defineComponent({
  name: 'App',

  components: {
    HomePage,
  },
});
</script>
<style lang="scss" module>
.application {
  font-family: Arial, Helvetica, sans-serif;
}
</style>
