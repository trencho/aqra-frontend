// @vitest-environment jsdom

/**
 * Contract test for the leaflet.heat API that utils/createMap.ts calls.
 *
 * createMap.spec.ts mocks both Leaflet and leaflet.heat, so nothing there
 * would notice the package changing shape again, the way 1.0.0 dropped the
 * `L.heatLayer` factory for an exported class. This file loads the real
 * modules.
 */
import L from 'leaflet';
import { HeatLayer } from 'leaflet.heat';
import { describe, expect, it } from 'vitest';

import { HEAT_GRADIENT, mapOptions } from '@/constants/map';

describe('leaflet.heat', () => {
  it('exports a HeatLayer class whose instances are Leaflet layers', () => {
    const layer = new HeatLayer([[41.99, 21.42, 0.5]], mapOptions);

    expect(layer).toBeInstanceOf(L.Layer);
    expect(typeof layer.addTo).toBe('function');
  });

  it('applies the options createMap passes', () => {
    const layer = new HeatLayer([], mapOptions);

    expect(layer.options.radius).toBe(50);
    expect(layer.options.minOpacity).toBe(0.5);
    expect(layer.options.gradient).toBe(HEAT_GRADIENT);
  });
});
