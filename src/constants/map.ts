import type { HeatMapOptions, LatLngTuple } from 'leaflet';

export const MIN_ZOOM = 9;
export const MAX_ZOOM = 15;

/**
 * Annotated rather than inferred: without it this widens to `number[]`, which
 * Leaflet's `setView` rejects because it wants a fixed-length pair.
 */
export const MACEDONIA_COORDINATES: LatLngTuple = [41.6086, 21.7453];

/**
 * Heatmap rendering options, passed to `L.heatLayer`.
 *
 * `scaleRadius: true` used to sit in here and has been removed: it is an option
 * of the unrelated leaflet-heatmap plugin, and leaflet.heat -- the plugin this
 * project actually uses -- never reads it. Its HeatLayer consults only radius,
 * blur, gradient, max, maxZoom and minOpacity. Nothing else in src/ referenced
 * it either, so this is dead configuration going away, not a behaviour change.
 * The HeatMapOptions type in src/types/leaflet.d.ts is what surfaced it.
 */
export const mapOptions: HeatMapOptions = {
  gradient: {
    0: '#2a962c',
    0.2: '#48f04b',
    0.4: '#fcf40a',
    0.6: '#e69b05',
    0.8: '#f73302',
    1: '#ad0000',
  },
  minOpacity: 0.5,
  radius: 50,
};
