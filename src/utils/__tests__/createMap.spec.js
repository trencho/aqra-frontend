import { describe, it, expect, vi, beforeEach } from 'vitest';

// Leaflet needs real DOM layout, so the whole module is mocked and these tests
// assert on the calls made to it rather than on rendered output.
vi.mock('leaflet', () => {
  const marker = () => ({ bindPopup: vi.fn(), addTo: vi.fn().mockReturnThis() });
  const L = {
    marker: vi.fn(() => {
      const m = { bindPopup: vi.fn() };
      m.addTo = vi.fn(() => m);
      return m;
    }),
    polygon: vi.fn(() => {
      const p = {};
      p.addTo = vi.fn(() => p);
      return p;
    }),
    tileLayer: vi.fn(() => {
      const t = {};
      t.addTo = vi.fn(() => t);
      return t;
    }),
    heatLayer: vi.fn(() => {
      const h = {};
      h.addTo = vi.fn(() => h);
      return h;
    }),
    __marker: marker,
  };
  return { default: L };
});

const L = (await import('leaflet')).default;
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

const map = () => ({ removeLayer: vi.fn(), fitBounds: vi.fn() });

const forecast = (value) => ({
  position: ['41.99', '21.42'],
  data: [{ time: '15/01/2024 10:30', pm10: value }],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mapCities', () => {
  it('adds one marker per city, labelled with its site name', () => {
    const m = map();

    const markers = mapCities(m, [
      { position: ['41.99', '21.42'], siteName: 'Skopje' },
      { position: ['41.03', '21.33'], siteName: 'Bitola' },
    ]);

    expect(markers).toHaveLength(2);
    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith(['41.99', '21.42']);
    expect(markers[0].bindPopup).toHaveBeenCalledWith('Skopje');
  });

  it('tolerates a null city list', () => {
    expect(mapCities(map(), null)).toEqual([]);
    expect(L.marker).not.toHaveBeenCalled();
  });
});

describe('mapSensorsInCities', () => {
  it('adds a marker per sensor across every city', () => {
    const markers = mapSensorsInCities(map(), [
      {
        sensors: {
          a: { position: ['1', '2'], description: 'Centar' },
          b: { position: ['3', '4'], description: 'Karpos' },
        },
      },
    ]);

    expect(markers).toHaveLength(2);
    expect(markers[0].bindPopup).toHaveBeenCalledWith('Centar');
  });

  // CHARACTERIZATION -- mapCities guards its argument with `(cities || [])`;
  // this function does not guard `c.sensors`, so a city whose sensors have not
  // been loaded yet throws. Enabling the sensor-markers toggle before sensors
  // resolve hits exactly this.
  it('currently THROWS for a city with no sensors loaded (known gap)', () => {
    expect(() => mapSensorsInCities(map(), [{}])).toThrow(TypeError);
  });
});

describe('createCityBoundaries', () => {
  it('draws one red polygon per city', () => {
    const polygons = createCityBoundaries(map(), [
      { borders: [['1', '2']] },
      { borders: [['3', '4']] },
    ]);

    expect(polygons).toHaveLength(2);
    expect(L.polygon).toHaveBeenCalledWith([['1', '2']], { color: 'red' });
  });

  it('tolerates a null city list', () => {
    expect(createCityBoundaries(map(), null)).toEqual([]);
  });
});

describe('removeLayer', () => {
  it('removes every layer from the map and returns null', () => {
    const m = map();
    const layers = [{ id: 1 }, { id: 2 }];

    expect(removeLayer(m, layers)).toBeNull();
    expect(m.removeLayer).toHaveBeenCalledTimes(2);
  });

  it('tolerates a null layer list — this is the idle state', () => {
    const m = map();

    expect(removeLayer(m, null)).toBeNull();
    expect(m.removeLayer).not.toHaveBeenCalled();
  });
});

describe('createBaseLayer', () => {
  it('adds the OpenStreetMap tile layer with the configured zoom bounds', () => {
    createBaseLayer(map());

    const [url, opts] = L.tileLayer.mock.calls[0];
    expect(url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(opts.attribution).toContain('OpenStreetMap');
    expect(opts.minZoom).toBeLessThan(opts.maxZoom);
  });
});

describe('createHeatLayer (single sensor)', () => {
  const city = { sensors: { 's1': { forecast: forecast(60) } } };

  it('normalises the reading by the pollutant ratio', () => {
    createHeatLayer(map(), {
      city,
      sensorId: 's1',
      pollutant: 'pm10',
      time: 0,
    });

    const [points] = L.heatLayer.mock.calls[0];
    expect(points).toEqual([['41.99', '21.42', 60 / PollutantRatio.pm10]]);
  });

  it('fits the map to the sensor position and returns the time axis', () => {
    const m = map();

    const result = createHeatLayer(m, {
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
    createHeatLayers(map(), {
      cities: [
        { forecast: forecast(60) },
        { forecast: { position: ['1', '2'], data: [{ time: 't' }] } },
      ],
      pollutant: 'pm10',
    });

    const [points] = L.heatLayer.mock.calls[0];
    expect(points).toHaveLength(1);
  });

  // CHARACTERIZATION -- createHeatLayer divides by PollutantRatio, these two do
  // not. The same reading therefore produces a different heat intensity
  // depending on which toggle is active, so the single-sensor and all-cities
  // views are not on the same scale.
  it('currently does NOT normalise by the pollutant ratio (inconsistent)', () => {
    createHeatLayers(map(), {
      cities: [{ forecast: forecast(60) }],
      pollutant: 'pm10',
    });

    const [points] = L.heatLayer.mock.calls[0];
    expect(points[0][2]).toBe(60);
    expect(points[0][2]).not.toBe(60 / PollutantRatio.pm10);
  });
});

describe('createSensorHeatLayers (all sensors)', () => {
  it('flattens readings across every sensor of every city', () => {
    createSensorHeatLayers(map(), {
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

    const [points] = L.heatLayer.mock.calls[0];
    expect(points).toHaveLength(2);
  });

  it('drops sensors with no reading for the pollutant', () => {
    createSensorHeatLayers(map(), {
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

    const [points] = L.heatLayer.mock.calls[0];
    expect(points).toHaveLength(1);
  });
});
