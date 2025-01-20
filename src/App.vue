<template>
  <VApp :class="$style.application">
    <HomePage />
  </VApp>
</template>

<script>
import HomePage from './components/home/HomePage';

export default {
  name: 'App',

  components: {
    HomePage
  },
};
</script>
<style lang="scss" module>
.application {
  font-family: Arial, Helvetica, sans-serif;
}
</style>