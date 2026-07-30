<template>
  <VFooter
    class="justify-center"
    color="#292929"
    height="100"
  >
    <!--
      Vuetify 3 dropped the `grey--text text--lighten-1` colour helpers in
      favour of `text-<colour>-<variant>`, and `title` became `text-h6`.
    -->
    <div class="text-h6 font-weight-light text-grey-lighten-1 text-center">
      {{ new Date().getFullYear() }}, {{ $t('common.skopje') }}
    </div>
  </VFooter>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'Footer',
});
</script>
