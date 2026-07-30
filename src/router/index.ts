import type { Component } from 'vue';
import type { Router, RouteRecordRaw,RouterHistory } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

import Content from '@/components/content/Content.vue';
import Map from '@/components/map/Map.vue';
import Statistics from '@/components/statistics/Statistics.vue';
import SwaggerDocumentation from '@/components/swaggerDocumentation/SwaggerDocumentation.vue';
import type { TabId } from '@/constants/navigationTabs';
import { tabByName,TabIds, Tabs } from '@/constants/navigationTabs';
import { useAirPollutionStore } from '@/stores/airPollution';

/**
 * Annotated `Record<TabId, Component>` rather than inferred, so adding a tab to
 * navigationTabs without giving it a component is a compile error instead of a
 * blank page. Same trick PollutantsLabels uses.
 */
const views: Record<TabId, Component> = {
  [TabIds.Home]: Content,
  [TabIds.PollutionMap]: Map,
  [TabIds.Statistics]: Statistics,
  [TabIds.SwaggerDocumentation]: SwaggerDocumentation,
};

/**
 * Routes are derived from Tabs, not written out again beside it. The app used
 * to switch tabs with four `v-if`s against a number in the Pinia store, which
 * meant no URLs, no deep links and no back button; deriving keeps the tab bar,
 * the menu drawer and the routing table from disagreeing about what exists.
 */
export const routes: RouteRecordRaw[] = [
  ...Tabs.map((tab) => ({
    path: tab.path,
    name: tab.name,
    component: views[tab.id],
  })),
  // Anything else lands on Home rather than rendering an empty <RouterView />.
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

/**
 * `history` is a parameter so tests can pass createMemoryHistory() -- jsdom has
 * a location, but driving real history entries across a suite leaks state
 * between specs.
 */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)
): Router {
  const router = createRouter({ history, routes });

  /**
   * The route is the source of truth for which tab is active; the store mirrors
   * it. Done here rather than by importing the router into the store, which
   * would make the store depend on the component tree it is consumed by.
   *
   * afterEach rather than a watcher in HomePage: it fires for the initial
   * navigation too, so a deep link to /statistics arrives with the store
   * already agreeing, instead of briefly reporting Home.
   *
   * changeTab is unchanged -- it records the id and closes the drawer, which is
   * still exactly what should happen on a navigation.
   */
  router.afterEach((to) => {
    const tab = tabByName(to.name as string | undefined);
    if (tab) {
      useAirPollutionStore().changeTab(tab.id);
    }
  });

  return router;
}

export const router = createAppRouter();
