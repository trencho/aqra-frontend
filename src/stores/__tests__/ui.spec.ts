import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { TabIds } from '@/constants/navigationTabs';

import { useUiStore } from '../ui';

// Moved wholesale out of airPollution.spec.ts when drawer and tabId moved out
// of that store. The assertions are unchanged, which is the point: this is a
// relocation, not a rewrite, and a behaviour change here would have shown up as
// an edit to an expectation.
let store: ReturnType<typeof useUiStore>;

beforeEach(() => {
  setActivePinia(createPinia());
  store = useUiStore();
});

describe('initial state', () => {
  it('starts on the Home tab with the drawer closed', () => {
    expect(store.tabId).toBe(TabIds.Home);
    expect(store.drawer).toBe(false);
  });
});

describe('ui actions', () => {
  it('setDrawer toggles the drawer', () => {
    store.setDrawer(true);
    expect(store.drawer).toBe(true);

    store.setDrawer(false);
    expect(store.drawer).toBe(false);
  });

  it('changeTab closes the drawer when moving to a different tab', () => {
    store.setDrawer(true);

    store.changeTab(TabIds.Statistics);

    expect(store.tabId).toBe(TabIds.Statistics);
    expect(store.drawer).toBe(false);
  });

  it('changeTab leaves the drawer alone when re-selecting the current tab', () => {
    store.changeTab(TabIds.Statistics);
    store.setDrawer(true);

    store.changeTab(TabIds.Statistics);

    expect(store.drawer).toBe(true);
  });
});

// Not in the relocated set. The air-pollution store carries API data, caches
// and an in-flight request count, and this asserts the ui store carries none of
// it -- the separation is the whole reason for the file, and it is invisible to
// every test above, all of which passed just as well when these two fields sat
// in the other store.
describe('separation from the data store', () => {
  it('holds the two chrome fields and nothing else', () => {
    expect(Object.keys(store.$state).sort()).toEqual(['drawer', 'tabId']);
  });
});
