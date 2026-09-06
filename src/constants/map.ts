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
/**
 * The six-stop colour ramp, as its own non-optional constant.
 *
 * Split out of `mapOptions` so the legend can read it without a `?? {}`
 * fallback: `HeatMapOptions.gradient` is optional in Leaflet's types, and a
 * legend silently falling back to no stops renders a blank bar -- the exact
 * shape of silent failure this file already records for `scaleRadius`.
 *
 * `mapOptions` below still references this object, so the ramp the heatmap
 * paints and the ramp the legend explains are the same value, not two copies
 * that happen to agree.
 *
 * Keys are number-like strings and JavaScript hoists integer-like ones, so
 * `Object.keys` here returns ['0', '1', '0.2', '0.4', '0.6', '0.8']. Anything
 * iterating this must sort numerically; utils/heatLegend.ts does.
 */
export const HEAT_GRADIENT: Record<number, string> = {
  0: '#2a962c',
  0.2: '#48f04b',
  0.4: '#fcf40a',
  0.6: '#e69b05',
  0.8: '#f73302',
  1: '#ad0000',
};

export const mapOptions: HeatMapOptions = {
  gradient: HEAT_GRADIENT,
  minOpacity: 0.5,
  radius: 50,
};
