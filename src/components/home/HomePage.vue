<template>
  <div>
    <VAppBar
      app
      flat
      color="#292929"
      height="60"
      fixed
      class="appBar"
    >
      <VContainer class="noMargin homePage">
        <VRow class="flex">
          <div class="flex">
            <VImg
              :src="logo"
              contain
              height="48"
              width="48"
              max-width="48"
              @click="$vuetify.goTo(0)"
            />
            <VAppBarNavIcon
              color="white"
              class="hidden-md-and-up"
              @click="setDrawer(!drawer)"
            />

            <VTabs
              background-color="transparent"
              dark
              grow
              :value="tabId"
            >
              <VTab
                v-for="tab in tabs"
                :key="tab.id"
                dark
                class="hidden-sm-and-down"
                small
                @change="changeTab(tab.id)"
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
      <Content v-if="tabId === TabIds.Home" />
      <Map v-if="tabId === TabIds.PollutionMap" />
      <Statistics v-if="tabId === TabIds.Statistics" />
      <SwaggerDocumentation v-if="tabId === TabIds.SwaggerDocumentation" />
    </VMain>

    <Footer />
  </div>
</template>

<script>
import {mapActions, mapState} from 'vuex';

import Footer from './Footer';
import MenuDrawer from './MenuDrawer';
import Map from '@/components/map/Map';
import Content from '@/components/content/Content';
import TranslationButton from './TranslationButton';
import Statistics from '@/components/statistics/Statistics';
import SwaggerDocumentation from '@/components/swaggerDocumentation/SwaggerDocumentation';

import {LocaleId} from '@/constants/locales';
import {TabIds, Tabs} from '@/constants/navigationTabs';

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
      locales: Object.values(LocaleId),
    }
  },

  computed: {
    ...mapState('airPollution', ['tabId', 'drawer']),
  },

  async beforeMount() {
    await this.initHomePage();
  },

  methods: {
    ...mapActions('airPollution', ['changeTab', 'initHomePage', 'setDrawer']),
  }
};
</script>