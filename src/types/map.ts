import type { City } from '@/classes/city';

import type { LayerKind, PollutantKey } from './domain';

/**
 * What the map currently has selected, and which heatmap strategy draws it.
 *
 * Lives here rather than in Map.vue because Filters.vue and SliderFilter.vue
 * both receive it as a prop, and Map.vue imports Filters -- so exporting it from
 * the component would make the import circular.
 *
 * Kept out of ./domain.ts because that module deliberately holds no reference to
 * the class layer, and this needs City.
 *
 * One object type with optional members rather than a union discriminated on
 * `selected`: Map.vue indexes CreateLayer with a runtime kind and spreads this
 * whole object into whichever factory it resolves to. Narrowing that properly
 * means a switch per kind in both setPollutant and sliderChange, which is a
 * component refactor rather than a typing change.
 */
export type SelectedLayer = {
  selected: LayerKind;
  pollutant: PollutantKey;
  cities?: City[] | undefined;
  city?: City | undefined;
  sensorId?: string | undefined;
  selectedTime?: string[] | undefined;
};
