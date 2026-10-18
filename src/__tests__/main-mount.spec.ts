// @vitest-environment jsdom

/**
 * Entry-point mount test, split out of main.spec.ts.
 *
 * ES modules evaluate once per file, so only the FIRST `import('@/main.ts')`
 * in a file mounts the app. Every later import returns the cached module and
 * mounts nothing, while each test's beforeEach has replaced document.body with
 * a fresh, empty #app. In main.spec.ts this test passed only while it was
 * declared first; under a shuffled order a Leaflet test imported main.ts ahead
 * of it and it saw an empty div. Alone in its own file, it is always the first
 * import, whatever the order.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { present } from '@/__tests__/support/expect';
import { stubBrowserApis } from '@/components/__tests__/helpers';

// Leaflet needs real layout, which jsdom has none of.
vi.mock('@/utils/createMap', () => ({
  createBaseLayer: vi.fn(),
  createCityBoundaries: vi.fn(() => []),
  mapCities: vi.fn(() => []),
  mapSensorsInCities: vi.fn(() => []),
  removeLayer: vi.fn(() => null),
}));

// Without this the store's real actions issue XHRs from jsdom, which surface
// as unhandled errors and fail the run even when every assertion passes.
vi.mock('@/services/api', () => ({
  aqra: {
    getDataForAllCities: vi.fn(() => Promise.resolve({ status: 200, data: [] })),
  },
}));

beforeEach(() => {
  stubBrowserApis();
  document.body.innerHTML = '<div id="app"></div>';
});

describe('main.js mount', () => {
  // Keep this the only test in the file; see the header for why.
  it('evaluates, mounts into #app, and renders the routed view', async () => {
    const { router } = await import('@/router');
    await expect(import('@/main.ts')).resolves.toBeDefined();

    // The initial navigation is asynchronous, so <RouterView /> renders empty
    // on the tick the module finishes. isReady() is what waits for it --
    // flushPromises is not enough, which is worth knowing before writing any
    // other DOM assertion against a freshly mounted app.
    await router.isReady();
    await nextTick();

    expect(present(document.querySelector('#app')).innerHTML).not.toBe('');

    // A missing `.use(router)` would still render the chrome -- app bar,
    // footer -- so the check above would not notice. #welcome-page exists only
    // inside the Home route's component, so finding it proves the router was
    // installed AND resolved the default location.
    expect(document.querySelector('#welcome-page')).not.toBeNull();
  });
});
