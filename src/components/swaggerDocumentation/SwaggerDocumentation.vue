<template>
  <div>
    <!--
      Was <vue-iframe> from vue-iframes, a Vue-2-only package last published in
      2020 (v0.0.21) with no Vue 3 build. It wrapped a single iframe, so a
      plain iframe replaces it and the dependency is gone.
    -->
    <iframe
      :style="frameStyle"
      title="AQRA API documentation"
      src="https://aqra.feit.ukim.edu.mk/api/v1/apidocs/"
    />
  </div>
</template>

<script>
import { belowAppBar } from '@/constants/layout';

export default {
  name: 'SwaggerDocumentation',

  computed: {
    frameStyle() {
      return {
        height: belowAppBar(),
        width: '100%',
        border: 'none',
      };
    },
  },
};
</script>
