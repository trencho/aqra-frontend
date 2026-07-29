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
      <VListItem
        v-for="(link, i) in links"
        :key="i"
        :title="$t(link.title)"
        :prepend-icon="link.icon"
        @click="store.changeTab(link.id)"
      />
    </VList>
  </VNavigationDrawer>
</template>

<script>
import { mapStores } from 'pinia';
import { useAirPollutionStore } from '@/stores/airPollution';
import { TabIds } from '@/constants/navigationTabs';

export default {
  name: 'MenuDrawer',

  data() {
    return {
      links: [
        {
          title: 'common.home',
          id: TabIds.Home,
          icon: 'mdi-home',
        },
        {
          title: 'common.pollutionMap',
          id: TabIds.PollutionMap,
          icon: 'mdi-map',
        },
        {
          title: 'common.statistics',
          id: TabIds.Statistics,
          icon: 'mdi-chart-bar',
        },
        {
          title: 'common.swaggerDocumentation',
          id: TabIds.SwaggerDocumentation,
          icon: 'mdi-text-box',
        },
      ],
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
      set(val) {
        this.store.setDrawer(val);
      },
    },
  },
};
</script>
