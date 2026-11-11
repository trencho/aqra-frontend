// leaflet.heat 1.0.0 ships types written against Leaflet 2, where `Layer` is
// generic: its HeatLayer `extends L.Layer<HeatLayerOptions & HeatLayerProps>`.
// @types/leaflet 1.9 declares a plain `Layer`, so under it that base fails to
// resolve and HeatLayer loses every inherited member (`addTo`, `options`).
// The runtime supports Leaflet 1.9 (its peer range is ^1.9.0 || ^2.0.0-beta.1);
// only the types are out of step. This merges the base back in.
//
// Delete this file when the app moves to Leaflet 2.
import 'leaflet.heat';

import type { Layer } from 'leaflet';

declare module 'leaflet.heat' {
  interface HeatLayer extends Layer {
    options: HeatLayerOptions;
  }
}
