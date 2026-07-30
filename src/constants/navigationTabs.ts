/**
 * `as const` inside the freeze: Object.freeze alone gives
 * `Readonly<{ Home: number, ... }>`, which widens each id to `number` and makes
 * the TabId union below meaningless.
 */
export const TabIds = Object.freeze({
  Home: 0,
  PollutionMap: 1,
  Statistics: 2,
  SwaggerDocumentation: 3,
} as const);

export type TabId = (typeof TabIds)[keyof typeof TabIds];

export interface Tab {
  /** An i18n key, not display text -- resolved through vue-i18n at render. */
  title: string;
  id: TabId;
  /**
   * The URL this tab lives at. Part of the tab definition rather than a
   * separate table in the router, so a tab cannot exist without a route or
   * drift away from one.
   */
  path: string;
  /** Route name, for navigating by name instead of by literal path. */
  name: string;
}

export const Tabs: Tab[] = [
  {
    title: 'common.home',
    id: TabIds.Home,
    path: '/',
    name: 'home',
  },
  {
    title: 'common.pollutionMap',
    id: TabIds.PollutionMap,
    path: '/map',
    name: 'map',
  },
  {
    title: 'common.statistics',
    id: TabIds.Statistics,
    path: '/statistics',
    name: 'statistics',
  },
  {
    title: 'common.swaggerDocumentation',
    id: TabIds.SwaggerDocumentation,
    path: '/api-docs',
    name: 'api-docs',
  },
];

/**
 * TabIds stay numeric and stay the thing components key off: VTabs' v-model,
 * MenuDrawer's list and the store's `tabId` all use them, and the specs assert
 * on them. These two functions are the whole path <-> id mapping.
 */
export function tabById(id: TabId): Tab {
  // Non-null: TabId is a closed union of the four ids Tabs declares, so this
  // cannot miss. A fifth id would be a compile error at the union, not a
  // runtime undefined here.
  return Tabs.find((t) => t.id === id)!;
}

/** Undefined for a route that is not a tab, which the caller must handle. */
export function tabByName(name: string | null | undefined): Tab | undefined {
  return Tabs.find((t) => t.name === name);
}
