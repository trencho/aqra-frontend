import type { LayerKind } from '@/types/domain';
import {
  createHeatLayer,
  createHeatLayers,
  createSensorHeatLayers,
} from '@/utils/createMap';

export const Layers = {
  AllCities: 'AllCities',
  AllSensors: 'AllSensors',
  SelectedSensor: 'SelectedSensor',
} as const satisfies Record<LayerKind, LayerKind>;

/**
 * Heatmap strategy lookup, dispatched from Map.vue by `selected.selected`.
 *
 * The wrapping arrows look redundant and are not: they keep the reference to
 * each createMap function inside a function body, so it resolves when a layer
 * is created rather than when this module is evaluated. Several component specs
 * mock '@/utils/createMap' partially, and an eager module-scope reference makes
 * vitest throw `No "createHeatLayers" export is defined on the mock` at import
 * time -- taking down app-mount.spec and main.spec, neither of which calls
 * these functions at all. Replacing the arrows with the bare functions was
 * tried and reverted.
 *
 * `Parameters<typeof …>` forwards each signature rather than restating it, so
 * these annotations cannot drift from createMap.
 *
 * `satisfies Record<LayerKind, unknown>` makes the lookup exhaustive: a new
 * LayerKind without a factory is a compile error, where before a missing entry
 * surfaced as `CreateLayer[kind] is not a function` at runtime, on click.
 */
export const CreateLayer = {
  AllCities: (...args: Parameters<typeof createHeatLayers>) =>
    createHeatLayers(...args),
  AllSensors: (...args: Parameters<typeof createSensorHeatLayers>) =>
    createSensorHeatLayers(...args),
  SelectedSensor: (...args: Parameters<typeof createHeatLayer>) =>
    createHeatLayer(...args),
} satisfies Record<LayerKind, unknown>;
