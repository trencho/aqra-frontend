import type { Map as LeafletMap } from 'leaflet';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { at } from '@/__tests__/support/expect';
import type { Position } from '@/types/domain';

// Leaflet needs real DOM layout, so the whole module is mocked and these tests
// assert on the calls made to it rather than on rendered output.
//
// One shared `layer()` factory now backs all four constructors, where the .js
// version repeated the object literal per constructor and also exported an
// unused `__marker`. Same behaviour -- a fresh object per call, with `addTo`
// returning itself so the chained call yields the layer -- with the dead export
// dropped.
vi.mock('leaflet', () => {
  const layer = () => {
    const l: Record<string, unknown> = {};
    l.addTo = vi.fn(() => l);
    l.bindPopup = vi.fn(() => l);
    return l;
  };

  return {
    default: {
      marker: vi.fn(layer),
      polygon: vi.fn(layer),
      tileLayer: vi.fn(layer),
      heatLayer: vi.fn(layer),
    },
  };
});

/** The four Leaflet constructors this module uses, as the mocks they are. */
interface LeafletDouble {
  marker: Mock;
  polygon: Mock;
  tileLayer: Mock;
  heatLayer: Mock;
}

const L = (await import('leaflet')).default as unknown as LeafletDouble;

const {
  mapCities,
  mapSensorsInCities,
  createCityBoundaries,
  removeLayer,
  createBaseLayer,
  createHeatLayer,
  createHeatLayers,
  createSensorHeatLayers,
} = await import('../createMap');
const { PollutantRatio } = await import('@/constants/pollutants');

/**
 * The two Map methods createMap actually calls.
 *
 * A named double rather than an inline cast at each call site: it states what
 * this module needs from Leaflet's Map, which is a far smaller surface than the
 * ~90 members the real type carries.
 */
interface MapDouble {
  removeLayer: Mock;
  fitBounds: Mock;
}

const map = (): MapDouble => ({ removeLayer: vi.fn(), fitBounds: vi.fn() });

/** Hand the double to code typed against Leaflet's own Map. */
const asMap = (double: MapDouble) => double as unknown as LeafletMap;

/** Read the mock methods off a layer the mocked Leaflet returned. */
const layerOf = (value: unknown) => value as unknown as { bindPopup: Mock };

const forecast = (value: number) => ({
  position: ['41.99', '21.42'] as Position,
  data: [{ time: '15/01/2024 10:30', pm10: value }],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mapCities', () => {
  it('adds one marker per city, labelled with its site name', () => {
    const m = map();

    const markers = mapCities(asMap(m), [
      { position: ['41.99', '21.42'], siteName: 'Skopje' },
      { position: ['41.03', '21.33'], siteName: 'Bitola' },
    ]);

    expect(markers).toHaveLength(2);
    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith(['41.99', '21.42']);
    expect(layerOf(at(markers, 0)).bindPopup).toHaveBeenCalledWith('Skopje');
  });

  it('tolerates a null city list', () => {
    expect(mapCities(asMap(map()), null)).toEqual([]);
    expect(L.marker).not.toHaveBeenCalled();
  });
});

describe('mapSensorsInCities', () => {
  it('adds a marker per sensor across every city', () => {
    const markers = mapSensorsInCities(asMap(map()), [
      {
        sensors: {
          a: { position: ['1', '2'], description: 'Centar' },
          b: { position: ['3', '4'], description: 'Karpos' },
        },
      },
    ]);

    expect(markers).toHaveLength(2);
    expect(layerOf(at(markers, 0)).bindPopup).toHaveBeenCalledWith('Centar');
  });

  // This used to throw a TypeError, which the sensor-markers toggle reached
  // whenever it was flipped before the sensor fetches resolved. `sensors` is
  // optional on City, so `{}` is now a legal argument and needs no cast.
  it('skips a city whose sensors have not loaded yet', () => {
    const markers = mapSensorsInCities(asMap(map()), [
      {},
      { sensors: { a: { position: ['1', '2'], description: 'Centar' } } },
    ]);

    expect(markers).toHaveLength(1);
    expect(layerOf(at(markers, 0)).bindPopup).toHaveBeenCalledWith('Centar');
  });
});

describe('createCityBoundaries', () => {
  it('draws one red polygon per city', () => {
    const polygons = createCityBoundaries(asMap(map()), [
      { borders: [['1', '2']] },
      { borders: [['3', '4']] },
    ]);

    expect(polygons).toHaveLength(2);
    expect(L.polygon).toHaveBeenCalledWith([['1', '2']], { color: 'red' });
  });

  it('tolerates a null city list', () => {
    expect(createCityBoundaries(asMap(map()), null)).toEqual([]);
  });
});

describe('removeLayer', () => {
  it('removes every layer from the map and returns null', () => {
    const m = map();
    const layers = [{ id: 1 }, { id: 2 }];

    expect(removeLayer(asMap(m), layers)).toBeNull();
    expect(m.removeLayer).toHaveBeenCalledTimes(2);
  });

  it('tolerates a null layer list — this is the idle state', () => {
    const m = map();

    expect(removeLayer(asMap(m), null)).toBeNull();
    expect(m.removeLayer).not.toHaveBeenCalled();
  });
});

describe('createBaseLayer', () => {
  it('adds the OpenStreetMap tile layer with the configured zoom bounds', () => {
    createBaseLayer(asMap(map()));

    const [url, opts] = at(L.tileLayer.mock.calls, 0);
    expect(url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(opts.attribution).toContain('OpenStreetMap');
    expect(opts.minZoom).toBeLessThan(opts.maxZoom);
  });
});

describe('createHeatLayer (single sensor)', () => {
  const city = { sensors: { s1: { forecast: forecast(60) } } };

  it('normalises the reading by the pollutant ratio', () => {
    createHeatLayer(asMap(map()), {
      city,
      sensorId: 's1',
      pollutant: 'pm10',
      time: 0,
    });

    const [points] = at(L.heatLayer.mock.calls, 0);
    expect(points).toEqual([['41.99', '21.42', 60 / PollutantRatio.pm10]]);
  });

  it('fits the map to the sensor position and returns the time axis', () => {
    const m = map();

    const result = createHeatLayer(asMap(m), {
      city,
      sensorId: 's1',
      pollutant: 'pm10',
    });

    expect(m.fitBounds).toHaveBeenCalledWith([['41.99', '21.42']]);
    expect(result.time).toEqual(['15/01/2024 10:30']);
  });
});

describe('createHeatLayers (all cities)', () => {
  it('includes only cities that have a reading for the pollutant', () => {
    createHeatLayers(asMap(map()), {
      cities: [
        { forecast: forecast(60) },
        { forecast: { position: ['1', '2'], data: [{ time: 't' }] } },
      ],
      pollutant: 'pm10',
    });

    const [points] = at(L.heatLayer.mock.calls, 0);
    expect(points).toHaveLength(1);
  });

  // All three layer factories are on one scale now. This one used to pass the
  // raw reading through, so a pm10 value of 60 rendered as intensity 60 --
  // sixty times the gradient's 1.0 ceiling, i.e. solid red -- while the
  // single-sensor view rendered the same 60 as 0.05.
  it('normalises by the pollutant ratio, as the single-sensor layer does', () => {
    createHeatLayers(asMap(map()), {
      cities: [{ forecast: forecast(60) }],
      pollutant: 'pm10',
    });

    // Named, because this test is specifically about the third element: a heat
    // point is [lat, lng, intensity], and the claim is about the intensity.
    const [points] = at(L.heatLayer.mock.calls, 0);
    const [, , intensity] = at(points as Array<[string, string, number]>, 0);

    expect(intensity).toBe(60 / PollutantRatio.pm10);
  });
});

describe('createSensorHeatLayers (all sensors)', () => {
  it('flattens readings across every sensor of every city', () => {
    createSensorHeatLayers(asMap(map()), {
      cities: [
        {
          sensors: {
            a: { forecast: forecast(10) },
            b: { forecast: forecast(20) },
          },
        },
      ],
      pollutant: 'pm10',
    });

    const [points] = at(L.heatLayer.mock.calls, 0);
    expect(points).toHaveLength(2);
  });

  it('drops sensors with no reading for the pollutant', () => {
    createSensorHeatLayers(asMap(map()), {
      cities: [
        {
          sensors: {
            a: { forecast: forecast(10) },
            b: { forecast: { position: ['1', '2'], data: [{ time: 't' }] } },
          },
        },
      ],
      pollutant: 'pm10',
    });

    const [points] = at(L.heatLayer.mock.calls, 0);
    expect(points).toHaveLength(1);
  });

  // The other two tests here assert only how many points come out, which is why
  // this factory silently kept the raw-reading scale while createHeatLayer used
  // the normalised one. Assert the intensity, so a third scale cannot appear.
  it('normalises by the pollutant ratio, like the other layer factories', () => {
    createSensorHeatLayers(asMap(map()), {
      cities: [{ sensors: { a: { forecast: forecast(60) } } }],
      pollutant: 'pm10',
    });

    const [points] = at(L.heatLayer.mock.calls, 0);
    const [, , intensity] = at(points as Array<[string, string, number]>, 0);

    expect(intensity).toBe(60 / PollutantRatio.pm10);
  });
});
