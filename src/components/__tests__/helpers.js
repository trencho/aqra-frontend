import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { h } from 'vue';
import { VApp } from 'vuetify/components';

import { i18n } from '@/services/i18n';
import { vuetify } from '@/services/vuetify';

/**
 * Browser APIs Vuetify 3+ touches on mount that jsdom does not implement.
 * Without these, every component test fails inside Vuetify rather than in the
 * component under test.
 */
export function stubBrowserApis() {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
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
    };
    global.visualViewport = window.visualViewport;
  }

  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * Global mount options wiring the real Vuetify and i18n plugins plus a testing
 * Pinia. Real plugins are deliberate: stubbing Vuetify would defeat the point,
 * since these tests exist to catch Vuetify 2 -> 4 API drift.
 */
export function globalMountOptions({ initialState, stubActions = true } = {}) {
  return {
    plugins: [
      createTestingPinia({ createSpy: vi.fn, initialState, stubActions }),
      i18n,
      vuetify,
    ],
  };
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
export function mountInApp(Component, options = {}) {
  const { props, global: globalOpts, ...rest } = options;

  return mount(
    {
      render: () => h(VApp, () => [h(Component, props)]),
    },
    {
      global: globalOpts,
      attachTo: document.body,
      ...rest,
    }
  );
}
