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
      :src="docsUrl"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { belowAppBar } from '@/constants/layout';
import { API_BASE_URL } from '@/services/axios';

export default defineComponent({
  name: 'SwaggerDocumentation',

  computed: {
    /**
     * Derived from the configured API root rather than hardcoded to
     * production, which is what it was. Every other request in the app honours
     * VITE_AQRA_API_URL; this tab did not, so pointing the app at a local API
     * left the documentation tab still talking to the live host -- and, while
     * that host is down, showing a 503 inside an otherwise working app.
     */
    docsUrl() {
      return `${API_BASE_URL}/apidocs/`;
    },

    frameStyle() {
      return {
        height: belowAppBar(),
        width: '100%',
        border: 'none',
      };
    },
  },
});
</script>
