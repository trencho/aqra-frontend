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
            <!--
              A real button, not a click handler on the image. As a bare VImg
              this was unreachable by keyboard and announced as nothing, so
              "scroll to top" simply did not exist for anyone not using a mouse.
            -->
            <VBtn
              :aria-label="$t('common.scrollToTop')"
              variant="plain"
              class="logoButton"
              @click="scrollToTop"
            >
              <VImg
                :alt="$t('common.aqraLogo')"
                :src="logo"
                height="48"
                width="48"
                max-width="48"
              />
            </VBtn>
            <VAppBarNavIcon
              v-if="$vuetify.display.smAndDown"
              color="white"
              @click="store.setDrawer(!store.drawer)"
            />

            <VTabs
              v-if="$vuetify.display.mdAndUp"
              v-model="activeTab"
              bg-color="transparent"
              grow
            >
              <VTab
                v-for="tab in tabs"
                :key="tab.id"
                :value="tab.id"
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

    <!--
      Request failures used to be invisible: every action checked
      `result.status === 200` and did nothing otherwise, while axios rejected
      on 4xx/5xx, so the rejection escaped unhandled and the UI simply sat
      there. The store now records the failure; this surfaces it.
    -->
    <VSnackbar
      :model-value="store.hasError"
      color="error"
      location="top"
      :timeout="-1"
      @update:model-value="store.clearError()"
    >
      {{ store.error }}
      <template #actions>
        <VBtn
          variant="text"
          @click="store.clearError()"
        >
          {{ $t('common.dismiss') }}
        </VBtn>
      </template>
    </VSnackbar>

    <VProgressLinear
      v-if="store.isLoading"
      indeterminate
      color="primary"
    />

    <VMain>
      <!--
        Was four v-ifs against a number in the store, which is why the app had
        no URLs, no deep links and no back button. The routing table is derived
        from the same Tabs constant the tab bar above iterates.
      -->
      <RouterView />
    </VMain>

    <Footer />
  </div>
</template>

<script lang="ts">
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';

import logo from '@/assets/logo.svg';
import type { TabId } from '@/constants/navigationTabs';
import { tabById,Tabs } from '@/constants/navigationTabs';
import { useAirPollutionStore } from '@/stores/airPollution';

import Footer from './Footer.vue';
import MenuDrawer from './MenuDrawer.vue';
import TranslationButton from './TranslationButton.vue';

export default defineComponent({
  name: 'HomePage',

  components: {
    Footer,
    MenuDrawer,
    TranslationButton,
  },

  data() {
    return {
      logo,
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
    //
    // The setter navigates rather than writing the store directly; the router's
    // afterEach then calls changeTab. Writing both here would let the tab bar
    // and the URL disagree whenever navigation is cancelled or redirected.
    activeTab: {
      get() {
        return this.store.tabId;
      },
      set(id: TabId) {
        void this.$router.push(tabById(id).path);
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
});
</script>
