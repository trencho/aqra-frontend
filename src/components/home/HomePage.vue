<template>
  <div>
    <VAppBar
      flat
      color="#292929"
      height="60"
      class="appBar"
    >
      <VContainer class="noMargin homePage">
        <VRow class="flex">
          <div class="flex">
            <VImg
              :src="logo"
              height="48"
              width="48"
              max-width="48"
              @click="scrollToTop"
            />
            <VAppBarNavIcon
              color="white"
              class="hidden-md-and-up"
              @click="store.setDrawer(!store.drawer)"
            />

            <VTabs
              v-model="activeTab"
              bg-color="transparent"
              grow
            >
              <VTab
                v-for="tab in tabs"
                :key="tab.id"
                :value="tab.id"
                class="hidden-sm-and-down"
                size="small"
              >
                {{ $t(tab.title) }}
              </VTab>
            </VTabs>
          </div>
          <VSpacer />
          <TranslationButton />
        </VRow>
      </VContainer>
    </VAppBar>
    <MenuDrawer />

    <VMain>
      <Content v-if="store.tabId === TabIds.Home" />
      <Map v-if="store.tabId === TabIds.PollutionMap" />
      <Statistics v-if="store.tabId === TabIds.Statistics" />
      <SwaggerDocumentation
        v-if="store.tabId === TabIds.SwaggerDocumentation"
      />
    </VMain>

    <Footer />
  </div>
</template>

<script>
import { mapStores } from 'pinia';

import Footer from './Footer.vue';
import MenuDrawer from './MenuDrawer.vue';
import Map from '@/components/map/Map.vue';
import Content from '@/components/content/Content.vue';
import TranslationButton from './TranslationButton.vue';
import Statistics from '@/components/statistics/Statistics.vue';
import SwaggerDocumentation from '@/components/swaggerDocumentation/SwaggerDocumentation.vue';

import { useAirPollutionStore } from '@/stores/airPollution';
import { TabIds, Tabs } from '@/constants/navigationTabs';

import logo from '@/assets/logo.svg';

export default {
  name: 'HomePage',

  components: {
    Map,
    Footer,
    Content,
    MenuDrawer,
    Statistics,
    TranslationButton,
    SwaggerDocumentation,
  },

  data() {
    return {
      logo,
      TabIds,
      tabs: Tabs,
    };
  },

  computed: {
    // mapStores exposes the store as `airPollutionStore`; alias it for brevity.
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },

    // VTabs is v-model driven in Vuetify 3+; the old `:value` + `@change`
    // pairing no longer emits.
    activeTab: {
      get() {
        return this.store.tabId;
      },
      set(id) {
        this.store.changeTab(id);
      },
    },
  },

  async beforeMount() {
    await this.store.initHomePage();
  },

  methods: {
    // Replaces $vuetify.goTo, which Vuetify 3 removed in favour of the useGoTo
    // composable -- not usable from an Options API component.
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
};
</script>
