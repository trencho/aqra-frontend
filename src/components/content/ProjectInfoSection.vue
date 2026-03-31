<template>
  <div class="paddingTop48 projectSectionBackground">
    <VContainer class="text-center">
      <h2 class="pageTitle">
        {{ $t('common.projectInfo') }}
      </h2>

      <VResponsive
        class="marginAuto marginBottom32"
        width="56"
      >
        <VDivider class="divider" />
        <VDivider />
      </VResponsive>

      <VRow>
        <VCol
          v-for="({ icon, title, text }, i) in info"
          :key="i"
          cols="12"
          md="6"
        >
          <VCard
            class="paddingTop48 px-4"
            color="grey lighten-5"
            flat
          >
            <VThemeProvider dark>
              <VAvatar
                color="#31404f"
                size="88"
              >
                <VIcon large>
                  {{ icon }}
                </VIcon>
              </VAvatar>
            </VThemeProvider>

            <VCardTitle class="justify-center font-weight-black text-uppercase">
              {{ $t(title) }}
            </VCardTitle>

            <VCardText class="subtitle-1">
              {{ $t(text) }}
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script>
export default {
  name: 'ProjectInfoSection',

  data() {
    return {
      info: [
        {
          icon: 'mdi-account-group-outline',
          title: 'common.description',
          text: 'common.descriptionContent',
        },
        {
          icon: 'mdi-update',
          title: 'common.usedTechnologies',
          text: 'common.usedTechnologiesContent',
        },
      ],
    };
  },
};
</script>
