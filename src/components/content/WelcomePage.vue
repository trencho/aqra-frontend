<template>
  <div>
    <VRow no-gutters>
      <VImg
        :height="'calc(100vh - ' + $vuetify.application.top + 'px)'"
        :src="background"
      >
        <VThemeProvider dark>
          <VContainer fill-height>
            <VRow align="center" class="marginAuto" justify="center">
              <VCol class="alignCenter" cols="12" tag="h1">
                <VImg :src="logo" height="286" width="253" />
                <span class="aqra">{{ $t('common.welcomeTo') }}</span>
                <VImg :src="name" width="350" />
              </VCol>
            </VRow>
          </VContainer>
        </VThemeProvider>
      </VImg>
    </VRow>
  </div>
</template>

<script>
import background from '@/assets/air-pollution.jpg';
import logo from '@/assets/logo.svg';
import name from '@/assets/name.svg';

export default {
  name: 'WelcomePage',

  data() {
    return {
      logo,
      name,
      background,
    };
  },
};
</script>
