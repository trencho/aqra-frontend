import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import type { StateTree } from 'pinia';
import { vi } from 'vitest';
import type { Component } from 'vue';
import { h } from 'vue';
import type { Router } from 'vue-router';
import { createMemoryHistory } from 'vue-router';
import { VApp } from 'vuetify/components';

import { createAppRouter } from '@/router';
import { i18n } from '@/services/i18n';
import { vuetify } from '@/services/vuetify';

/**
 * A fresh router per mount, on memory history.
 *
 * Fresh because a router carries its current location, so sharing one would let
 * a spec that navigates decide where the next spec starts. Memory history
 * because jsdom's location is shared across a file and driving real history
 * entries leaks the same way.
 */
export function testRouter(): Router {
  return createAppRouter(createMemoryHistory());
}

/**
 * Browser APIs Vuetify 3+ touches on mount that jsdom does not implement.
 * Without these, every component test fails inside Vuetify rather than in the
 * component under test.
 *
 * The casts here are all the same shape: these are deliberately partial stubs
 * of large DOM interfaces, implementing only the members Vuetify actually
 * reaches for. Filling in `onresize`, `pageLeft`, `takeRecords` and friends
 * would be inventing behaviour no test exercises.
 */
export function stubBrowserApis() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.scrollTo = vi.fn();

  // VOverlay (and therefore VMenu, VSnackbar, VDialog) reads visualViewport
  // when positioning, which jsdom does not implement at all.
  if (!window.visualViewport) {
    window.visualViewport = {
      width: 1024,
      height: 768,
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;
    global.visualViewport = window.visualViewport;
  }

  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}

/**
 * Drive Vuetify's responsive breakpoints in jsdom.
 *
 * HomePage and Map each pick between a desktop and a mobile layout using
 * `$vuetify.display.mdAndUp` / `.smAndDown`. jsdom reports a fixed 1024px
 * viewport, so without this every test only ever exercises the desktop branch.
 *
 * That blind spot has already cost this project once: these components used to
 * use Vuetify 2's `hidden-sm-and-down` / `hidden-md-and-up` classes, which
 * Vuetify 3 removed. Both layouts therefore rendered at once -- two "Pollutants"
 * selects, ten checkboxes, and the hamburger sitting next to the tab bar -- and
 * the whole suite stayed green because no test ever changed the viewport.
 *
 * Call it AFTER mounting, then await a tick. Vuetify's display state is created
 * once and only tracks `window.innerWidth` through a resize listener that lives
 * inside a mounted app's effect scope -- resizing before mount updates nothing,
 * because at that moment no listener is attached.
 */
export function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

export interface GlobalMountOptions {
  /** Seed store state, keyed by store id. */
  initialState?: StateTree | undefined;
  /** False runs the real actions instead of spying on them. */
  stubActions?: boolean | undefined;
}

/**
 * Global mount options wiring the real Vuetify and i18n plugins plus a testing
 * Pinia. Real plugins are deliberate: stubbing Vuetify would defeat the point,
 * since these tests exist to catch Vuetify 2 -> 4 API drift.
 *
 * The parameter is annotated rather than inferred from its `= {}` default --
 * without that, TypeScript reads the shape off the default value alone and
 * `initialState` silently becomes an unknown property at every call site.
 */
export function globalMountOptions({
  initialState,
  stubActions = true,
}: GlobalMountOptions = {}) {
  return {
    plugins: [
      // Pinia first: the router's afterEach resolves the store, and the initial
      // navigation is dispatched when the router plugin installs.
      createTestingPinia({
        createSpy: vi.fn,
        stubActions,
        // Spread rather than passed directly: TestingOptions declares
        // `initialState?` without `| undefined`, so under
        // exactOptionalPropertyTypes handing it an explicit undefined is an
        // error. Omitting the key entirely is what "no seed state" means.
        ...(initialState ? { initialState } : {}),
      }),
      testRouter(),
      i18n,
      vuetify,
    ],
  };
}

/**
 * Reach the members a test needs on a mounted component's instance.
 *
 * A component's Options API instance type does not survive being mounted
 * through a generic helper, so `wrapper.vm.someMethod()` is unchecked. Naming
 * the shape at the call site is strictly better than casting to `any`: the test
 * states what it relies on, and a renamed method or a changed signature still
 * fails to compile right here.
 */
export function vmOf<T>(wrapper: { vm: unknown }): T {
  return wrapper.vm as T;
}

export interface MountInAppOptions {
  props?: Record<string, unknown> | undefined;
  /**
   * Either a globalMountOptions() result or a hand-built `{ plugins: [...] }` --
   * error-state.spec deliberately mounts without a testing Pinia so it can drive
   * the real store.
   */
  global?: { plugins: unknown[] } | undefined;
}

/**
 * Mount a component inside a VApp.
 *
 * Vuetify 3+ layout components -- VNavigationDrawer, VAppBar, VMain -- inject a
 * layout from VApp and throw "Could not find injected layout" when mounted
 * standalone. Vuetify 2 had no such requirement, so this is migration fallout
 * rather than a test-harness quirk.
 *
 * Returns the wrapper for the VApp; use `.findComponent(Component)` to reach
 * the component under test.
 */
export function mountInApp(
  Component: Component,
  options: MountInAppOptions = {}
) {
  const { props, global: globalOpts } = options;

  return mount(
    {
      render: () => h(VApp, () => [h(Component, props)]),
    },
    {
      attachTo: document.body,
      // Conditional spread for the same reason as initialState above: the
      // mounting options declare `global?` without `| undefined`. The cast
      // covers the plugin array, which test-utils types far more precisely than
      // any caller here needs to state.
      ...(globalOpts
        ? { global: globalOpts as { plugins: never[] } }
        : {}),
    }
  );
}
