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
  it('evaluates and mounts the app into #app', async () => {
    await expect(import('@/main.js')).resolves.toBeDefined();

    expect(document.querySelector('#app').innerHTML).not.toBe('');
  });

  it('loads leaflet.heat after Leaflet, so L.heatLayer is registered', async () => {
    await import('@/main.js');
    const L = (await import('leaflet')).default;

    // If leaflet.heat were evaluated before Leaflet, the import above would
    // already have thrown. This asserts the plugin actually attached rather
    // than merely that nothing blew up.
    expect(typeof L.heatLayer).toBe('function');
  });

  it('rewrites the Leaflet default marker icon URLs for the bundler', async () => {
    await import('@/main.js');
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
