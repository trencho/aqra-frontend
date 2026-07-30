// @vitest-environment jsdom

/**
 * The app had no router at all until now: tab state lived in the Pinia store
 * and four `v-if`s chose a view, so there were no URLs, no deep links and no
 * back button. These tests cover the three things that arrangement could not
 * do, plus the one piece of glue holding the old store state in sync.
 */
import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';

import { TabIds, Tabs } from '@/constants/navigationTabs';
import { createAppRouter, routes } from '@/router';
import { useAirPollutionStore } from '@/stores/airPollution';

const router = () => createAppRouter(createMemoryHistory());

beforeEach(() => {
  // The router's afterEach resolves the store, so one has to be active before
  // any navigation is dispatched. A real pinia, not a testing one: changeTab is
  // the behaviour under test here, so stubbing it would assert nothing.
  setActivePinia(createPinia());
});

describe('routes', () => {
  // Derived from Tabs rather than written out again, so this is really checking
  // that the derivation covers every tab -- a tab with no route renders a blank
  // page, and the tab bar would still show it.
  it('declares one route per navigation tab, plus a catch-all', () => {
    expect(routes).toHaveLength(Tabs.length + 1);

    for (const tab of Tabs) {
      const route = routes.find((r) => r.name === tab.name);
      expect(route?.path).toBe(tab.path);
      expect(route?.component).toBeTruthy();
    }
  });
});

describe('navigation', () => {
  it.each(Tabs.map((t) => [t.path, t.name]))(
    'resolves a deep link to %s as the %s route',
    async (path, name) => {
      const r = router();
      await r.push(path as string);

      expect(r.currentRoute.value.name).toBe(name);
    }
  );

  it('redirects an unknown path to home rather than rendering nothing', async () => {
    const r = router();
    await r.push('/does-not-exist');

    expect(r.currentRoute.value.path).toBe('/');
    expect(r.currentRoute.value.name).toBe('home');
  });

  it('supports going back, which the store-driven tabs could not', async () => {
    const r = router();
    await r.push('/map');
    await r.push('/statistics');

    r.back();
    // back() returns void and the navigation it triggers is asynchronous;
    // isReady() is no help because the router is already ready by this point.
    await flushPromises();

    expect(r.currentRoute.value.path).toBe('/map');
  });
});

describe('store synchronisation', () => {
  it('mirrors the resolved route onto the store tabId', async () => {
    const r = router();
    const store = useAirPollutionStore();

    await r.push('/statistics');

    expect(store.tabId).toBe(TabIds.Statistics);
  });

  // afterEach fires for the initial navigation too, which is why this is a
  // router guard and not a watcher in HomePage: a deep link has to arrive with
  // the store already agreeing, not briefly reporting Home and correcting.
  it('syncs on the initial navigation, so a deep link never shows Home first', async () => {
    const r = createAppRouter(createMemoryHistory('/'));
    const store = useAirPollutionStore();
    r.push('/api-docs');
    await r.isReady();

    expect(store.tabId).toBe(TabIds.SwaggerDocumentation);
  });

  // The guard is `if (tab)` for a reason: a route added later that is not one
  // of the four tabs must not write a bogus tabId. addRoute is how that becomes
  // reachable today -- there is no such route yet, and the catch-all redirects
  // to a tab before afterEach ever sees it.
  it('leaves tabId alone for a route that is not a tab', async () => {
    const r = router();
    r.addRoute({
      path: '/not-a-tab',
      name: 'not-a-tab',
      component: { template: '<div />' },
    });
    const store = useAirPollutionStore();
    await r.push('/statistics');

    await r.push('/not-a-tab');

    expect(store.tabId).toBe(TabIds.Statistics);
  });

  it('closes the drawer when navigation changes the tab', async () => {
    const r = router();
    const store = useAirPollutionStore();
    store.setDrawer(true);

    await r.push('/map');

    expect(store.drawer).toBe(false);
  });
});
