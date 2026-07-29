<template>
  <VMenu
    :close-on-content-click="true"
    location="bottom"
    class="zIndex500"
  >
    <!--
      Vuetify 3+ hands the activator a single `props` object to v-bind. The
      Vuetify 2 contract was `{ on, attrs }` with a separate v-on -- that slot
      shape silently renders a dead button here.
    -->
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        class="transparentBackground"
        color="white"
        elevation="2"
        icon
        size="large"
      >
        {{ store.locale }}
      </VBtn>
    </template>

    <VList>
      <VListItem
        v-for="(item, index) in locales"
        :key="index"
      >
        <VBtn
          variant="text"
          @click="store.setLocale(item)"
        >
          {{ item }}
        </VBtn>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script>
import { mapStores } from 'pinia';
import { useLocaleStore } from '@/stores/locale';
import { LocaleId } from '@/constants/locales';

export default {
  name: 'TranslationButton',

  data() {
    return {
      locales: Object.values(LocaleId),
    };
  },

  computed: {
    ...mapStores(useLocaleStore),

    store() {
      return this.localeStore;
    },
  },
};
</script>
