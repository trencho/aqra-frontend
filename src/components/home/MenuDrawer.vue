<template>
  <VNavigationDrawer
    v-model="drawer"
    class="menuDrawer"
    temporary
  >
    <VList>
      <VListItem
        title="AQRA"
        subtitle="Air Quality REST API"
      />
      <VDivider />
      <!--
        `to` rather than a click handler, so each entry renders as a real link:
        middle-clickable, keyboard-focusable, and with an address the browser
        can show. The store's tabId is updated by the router's afterEach, and
        changeTab still closes the drawer as part of that.
      -->
      <VListItem
        v-for="(link, i) in links"
        :key="i"
        :title="$t(link.title)"
        :prepend-icon="link.icon"
        :to="link.path"
      />
    </VList>
  </VNavigationDrawer>
</template>

<script lang="ts">
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';

import type { TabId } from '@/constants/navigationTabs';
import { TabIds, Tabs } from '@/constants/navigationTabs';
import { useAirPollutionStore } from '@/stores/airPollution';

/**
 * The drawer's own icons, merged onto the shared Tabs definition rather than
 * restated alongside a second copy of every title and id. This list used to
 * duplicate all four tabs, so adding one meant editing two files and the tab
 * bar and the drawer could silently disagree about what exists.
 */
const ICONS: Record<TabId, string> = {
  [TabIds.Home]: 'mdi-home',
  [TabIds.PollutionMap]: 'mdi-map',
  [TabIds.Statistics]: 'mdi-chart-bar',
  [TabIds.SwaggerDocumentation]: 'mdi-text-box',
};

export default defineComponent({
  name: 'MenuDrawer',

  data() {
    return {
      links: Tabs.map((tab) => ({ ...tab, icon: ICONS[tab.id] })),
    };
  },

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },

    drawer: {
      get() {
        return this.store.drawer;
      },
      set(val: boolean) {
        this.store.setDrawer(val);
      },
    },
  },
});
</script>
