import { defineStore } from 'pinia';

import type { TabId } from '@/constants/navigationTabs';
import { TabIds } from '@/constants/navigationTabs';

export interface UiState {
  /** Whether the navigation drawer is open. */
  drawer: boolean;
  /**
   * Which tab is active.
   *
   * A mirror of the route, not a source of truth. The router's afterEach writes
   * it (see router/index.ts) so a deep link arrives with the tab bar already
   * agreeing; nothing else should assign it.
   */
  tabId: TabId;
}

/**
 * App chrome: the drawer and the active tab.
 *
 * These two lived in the air-pollution store, which was the only reason
 * router/index.ts imported a store full of API data and caches to record which
 * tab is showing. Neither field is about air pollution, and neither has ever
 * been read by anything that fetches.
 */
export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    drawer: false,
    tabId: TabIds.Home,
  }),

  actions: {
    setDrawer(drawer: boolean) {
      this.drawer = drawer;
    },

    /**
     * Record the active tab, closing the drawer if the tab actually changed.
     *
     * The conditional is not a micro-optimisation: re-selecting the current tab
     * must leave an open drawer open, which is asserted separately from the
     * closing case.
     */
    changeTab(id: TabId) {
      if (id !== this.tabId) {
        this.drawer = false;
      }
      this.tabId = id;
    },
  },
});
