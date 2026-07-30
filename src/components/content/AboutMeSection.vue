<template>
  <div class="aboutMePage">
    <VContainer class="text-center">
      <h2 class="pageTitle">
        {{ $t('common.aboutMe') }}
      </h2>
      <VResponsive
        class="marginBottom32 marginAuto"
        width="56"
      >
        <VDivider class="divider" />
        <VDivider />
      </VResponsive>

      <VResponsive
        class="description marginAuto marginBottom32"
        max-width="720"
      >
        {{ $t('common.aboutMeContent') }}
      </VResponsive>
      <VAvatar
        class="elevation-12 marginBottom48"
        size="130"
      >
        <VImg :src="avatar" />
      </VAvatar>
    </VContainer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import avatar from '@/assets/avatar.png';

export default defineComponent({
  name: 'AboutMeSection',
  data() {
    return {
      avatar,
    };
  },
});
</script>
