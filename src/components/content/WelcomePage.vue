<template>
  <div>
    <VRow no-gutters>
      <VImg
        :alt="$t('common.backgroundImage')"
        :height="belowAppBar()"
        :src="background"
      >
        <!-- Vuetify 3 replaced the boolean `dark` prop with a named theme. -->
        <VThemeProvider theme="dark">
          <VContainer class="fill-height">
            <VRow
              align="center"
              class="marginAuto"
              justify="center"
            >
              <VCol
                class="alignCenter"
                cols="12"
                tag="h1"
              >
                <VImg
                  :alt="$t('common.aqraLogo')"
                  :src="logo"
                  height="286"
                  width="253"
                />
                <span class="aqra">{{ $t('common.welcomeTo') }}</span>
                <!-- The wordmark repeats the adjacent "Welcome to AQRA" text, so it
                     is decorative: an empty alt keeps a screen reader from saying it twice. -->
                <VImg
                  alt=""
                  :src="name"
                  width="350"
                />
              </VCol>
            </VRow>
          </VContainer>
        </VThemeProvider>
      </VImg>
    </VRow>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import background from '@/assets/air-pollution.jpg';
import logo from '@/assets/logo.svg';
import name from '@/assets/name.svg';
import { belowAppBar } from '@/constants/layout';

export default defineComponent({
  name: 'WelcomePage',

  data() {
    return {
      logo,
      name,
      background,
    };
  },

  methods: {
    belowAppBar,
  },
});
</script>
