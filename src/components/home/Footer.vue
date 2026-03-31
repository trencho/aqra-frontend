<template>
  <VFooter
    class="justify-center"
    color="#292929"
    height="100"
  >
    <div class="title font-weight-light grey--text text--lighten-1 text-center">
      {{ new Date().getFullYear() }}, {{ $t('common.skopje') }}
    </div>
  </VFooter>
</template>

<script>
export default {
  name: 'Footer',
};
</script>
