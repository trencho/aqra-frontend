// @vitest-environment jsdom

/**
 * Entry-point evaluation test.
 *
 * `src/main.js` is the one module nothing else imports, so nothing else
 * evaluates it: the mount smoke test in app-mount.spec.js rebuilds the plugin
 * wiring by hand rather than going through the entry point. A `vite build`
 * does not evaluate module bodies either. That left a real blind spot --
 * anything that throws at import time in main.js ships green.
 *
 * The concrete case this guards: `leaflet.heat` contains no import or require
 * of Leaflet. It reaches for a bare global `L` and hangs `L.heatLayer` off it,
 * so it must be evaluated *after* `import L from 'leaflet'` or it throws
 * `L is not defined`. An import sorter that hoists side-effect imports to the
 * top of the file reorders exactly that pair.
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

describe('main.js', () => {
  /**
   * Every DOM assertion in this file has to live in this one test.
   *
   * ES modules evaluate once per file, so the `import('@/main.ts')` in a later
   * test returns the cached module and mounts nothing -- while the beforeEach
   * above has already replaced document.body with a fresh, empty #app. The
   * tests below get away with a bare `await import` because they assert on
   * Leaflet's globals, which survive; anything reading the DOM would see an
   * empty div and fail for a reason that has nothing to do with what it checks.
   */
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

  it('loads leaflet.heat after Leaflet, so L.heatLayer is registered', async () => {
    await import('@/main.ts');
    const L = (await import('leaflet')).default;

    // If leaflet.heat were evaluated before Leaflet, the import above would
    // already have thrown. This asserts the plugin actually attached rather
    // than merely that nothing blew up.
    expect(typeof L.heatLayer).toBe('function');
  });

  it('rewrites the Leaflet default marker icon URLs for the bundler', async () => {
    await import('@/main.ts');
    const L = (await import('leaflet')).default;

    // Leaflet resolves its default marker images relative to its own CSS,
    // which does not survive bundling; main.js points them at imported asset
    // URLs instead. IconDefault defines its own _getIconUrl that derives paths
    // that way, and it has to go or it wins over the merged options. Asserted
    // as an OWN property: deleting it leaves Icon.prototype's inherited
    // version reachable down the chain, so a plain undefined check can never
    // hold and would pass whether or not the delete ran.
    expect(
      Object.prototype.hasOwnProperty.call(
        L.Icon.Default.prototype,
        '_getIconUrl'
      )
    ).toBe(false);
    expect(L.Icon.Default.prototype.options.iconUrl).toBeTruthy();
    expect(L.Icon.Default.prototype.options.shadowUrl).toBeTruthy();
  });
});
