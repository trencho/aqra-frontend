<template>
  <VNavigationDrawer v-model="drawer" class="menuDrawer" app dark temporary>
    <VList>
      <VListItemContent>
        <VListItemTitle class="text-h6"> AQRA </VListItemTitle>
        <VListItemSubtitle> Air Quality REST API </VListItemSubtitle>
      </VListItemContent>
      <VDivider />
      <VListItem
        v-for="(link, i) in links"
        :key="i"
        @click="changeTab(link.id)"
      >
        <VListItemIcon>
          <v-icon>{{ link.icon }}</v-icon>
        </VListItemIcon>
        <VListItemTitle>{{ $t(link.title) }}</VListItemTitle>
      </VListItem>
    </VList>
  </VNavigationDrawer>
</template>

<script>
import { mapActions } from 'vuex';
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
    drawer: {
      get() {
        return this.$store.state.airPollution.drawer;
      },
      set(val) {
        this.setDrawer(val);
      },
    },
  },

  methods: mapActions('airPollution', ['setDrawer', 'changeTab']),
};
</script>
