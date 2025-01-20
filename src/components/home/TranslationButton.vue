<template>
  <VMenu
    :close-on-content-click="true"
    bottom
    class="zIndex500"
    nudge-bottom="50"
  >
    <template #activator="{ on, attrs }">
      <VBtn
        class="transparentBackground"
        color="white"
        elevation="2"
        icon
        large
        v-bind="attrs"
        v-on="on"
      >
        {{ locale }}
      </VBtn>
    </template>

    <VList
      dark
    >
      <VListItem
        v-for="(item, index) in locales"
        :key="index"
      >
        <VBtn
          text
          @click="setLocale(item)"
        >
          {{ item }}
        </VBtn>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script>
import {mapActions, mapState} from 'vuex';

import {LocaleId} from '@/constants/locales';

export default {
  name: 'TranslationButton',

  data() {
    return {
      locales: Object.values(LocaleId),
    }
  },

  computed: mapState('locale', ['locale']),
  methods: mapActions('locale', ['setLocale'])
};
</script>