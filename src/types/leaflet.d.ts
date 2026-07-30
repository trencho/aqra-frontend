// Augments @types/leaflet with the two things this app uses that are not in it.
// `import 'leaflet'` (rather than a bare declare) is what makes this file a
// module, which is required for `declare module` to augment instead of replace.
import 'leaflet';

// Everything below is `export`ed on purpose. Inside a module augmentation the
// block follows module scoping rules, so an un-exported declaration stays local
// to this file and `import type { HeatMapOptions } from 'leaflet'` would fail to
// resolve it. Named type imports are the only option here: @types/leaflet
// declares `export as namespace L` with no default export, so the `L` from
// `import L from 'leaflet'` is a synthetic default -- usable as a value, but not
// as a type namespace (`L.Map` does not resolve as a type through it).
declare module 'leaflet' {
  /**
   * A heat point: [lat, lng] with an optional third element carrying the
   * intensity. leaflet.heat reads intensity from `latlng.alt` or `latlng[2]`
   * and defaults it to 1 -- see HeatLayer.js `_redraw`.
   */
  export type HeatLatLngTuple = [number, number, number];

  /**
   * Options leaflet.heat actually reads.
   *
   * Deliberately exhaustive and no wider: `_updateOptions` reads radius, blur,
   * gradient and max; `_redraw` reads max, maxZoom and minOpacity. Nothing else
   * is consulted anywhere in the plugin.
   *
   * Note what is NOT here: `scaleRadius`. src/constants/map.js passes it, but
   * it belongs to the unrelated leaflet-heatmap plugin and leaflet.heat ignores
   * it completely. Widening this interface to accept it would document a
   * setting that has never had any effect.
   */
  export interface HeatMapOptions {
    /** Point radius in pixels. Falls back to simpleheat's default (25). */
    radius?: number;
    /** Blur radius in pixels. Defaults to the radius. */
    blur?: number;
    /** Intensity -> colour stops, keyed by a 0..1 position. */
    gradient?: Record<number, string>;
    /** Intensity treated as full saturation. Defaults to 1. */
    max?: number;
    /** Opacity floor for the lowest non-zero intensity. */
    minOpacity?: number;
    /** Zoom at which `max` applies. Defaults to the map's max zoom. */
    maxZoom?: number;
  }

  export class HeatLayer extends Layer {
    constructor(
      latlngs: Array<LatLngExpression | HeatLatLngTuple>,
      options?: HeatMapOptions
    );
    setLatLngs(latlngs: Array<LatLngExpression | HeatLatLngTuple>): this;
    addLatLng(latlng: LatLngExpression | HeatLatLngTuple): this;
    setOptions(options: HeatMapOptions): this;
    redraw(): this;
  }

  export function heatLayer(
    latlngs: Array<LatLngExpression | HeatLatLngTuple>,
    options?: HeatMapOptions
  ): HeatLayer;

  export namespace Icon {
    /**
     * Merges into the `Icon.Default` class declaration.
     *
     * `_getIconUrl` is a Leaflet internal, so @types/leaflet does not declare
     * it -- but src/main.ts has to `delete` it for bundled marker images to
     * resolve. Declaring it here keeps that line honest instead of suppressing
     * the error with a comment.
     *
     * Optional because deleting it is the entire point.
     */
    interface Default {
      _getIconUrl?: (name: string) => string;
    }
  }
}
