// Augments @types/leaflet with the two things this app uses that are not in it:
// the heat-point tuple and Icon.Default's internal `_getIconUrl`.
// `import 'leaflet'` (rather than a bare declare) is what makes this file a
// module, which is required for `declare module` to augment instead of replace.
import 'leaflet';

// Everything below is `export`ed on purpose. Inside a module augmentation the
// block follows module scoping rules, so an un-exported declaration stays local
// to this file and `import type { HeatLatLngTuple } from 'leaflet'` would fail to
// resolve it. Named type imports are the only option here: @types/leaflet
// declares `export as namespace L` with no default export, so the `L` from
// `import L from 'leaflet'` is a synthetic default -- usable as a value, but not
// as a type namespace (`L.Map` does not resolve as a type through it).
declare module 'leaflet' {
  /**
   * A heat point: [lat, lng, intensity]. leaflet.heat 1.0.0 reads intensity
   * from `latlng[2]` and treats a missing or null one as 1, so the builders in
   * utils/createMap.ts drop a point with no reading instead of passing it on.
   * The HeatLayer class and its options type come from the package itself.
   */
  export type HeatLatLngTuple = [number, number, number];

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
