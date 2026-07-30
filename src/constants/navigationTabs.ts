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
}

export const Tabs: Tab[] = [
  {
    title: 'common.home',
    id: TabIds.Home,
  },
  {
    title: 'common.pollutionMap',
    id: TabIds.PollutionMap,
  },
  {
    title: 'common.statistics',
    id: TabIds.Statistics,
  },
  {
    title: 'common.swaggerDocumentation',
    id: TabIds.SwaggerDocumentation,
  },
];
