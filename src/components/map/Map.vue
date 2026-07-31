<template>
  <div>
    <!--
      The map is this route's primary content but is built entirely by Leaflet,
      so without an explicit role and name it is announced as nothing at all.
      The heading is visually hidden: the page has no visible title, and axe
      flags every route here for having no level-one heading.
    -->
    <h1 class="visuallyHidden">{{ $t('common.pollutionMap') }}</h1>
    <div
      id="map"
      role="application"
      :aria-label="$t('common.mapLabel')"
      :style="mapStyle"
    />
    <div v-if="$vuetify.display.mdAndUp">
      <Filters
        class="filterLarge"
        :selected="selected"
        @setName="setName"
        @setValue="store.setValue"
        @setPollutant="setPollutant"
        @changeBoundaries="changeBoundaries"
        @changeCityMarkers="changeCityMarkers"
        @changeSensorMarkers="changeSensorMarkers"
        @setShowForAllCities="setShowForAllCities"
        @setShowForAllSensors="setShowForAllSensors"
        @sliderChange="sliderChange"
      />
    </div>
    <div v-if="$vuetify.display.smAndDown">
      <VBtn
        icon
        class="scrollButton"
        @click="scrollDown"
      >
        <VIcon color="white"> mdi-chevron-down </VIcon>
      </VBtn>
      <Filters
        :selected="selected"
        @setName="setName"
        @setValue="store.setValue"
        @setPollutant="setPollutant"
        @changeBoundaries="changeBoundaries"
        @changeCityMarkers="changeCityMarkers"
        @changeSensorMarkers="changeSensorMarkers"
        @setShowForAllCities="setShowForAllCities"
        @setShowForAllSensors="setShowForAllSensors"
        @sliderChange="sliderChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type {
  HeatLayer,
  LatLngBoundsExpression,
  Map as LeafletMap,
  Marker,
  Polygon,
} from 'leaflet';
import L from 'leaflet';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';

import { CreateLayer, Layers } from '@/constants/layers';
import { belowAppBar } from '@/constants/layout';
import { MACEDONIA_COORDINATES, MIN_ZOOM } from '@/constants/map';
import { useAirPollutionStore } from '@/stores/airPollution';
import type {
  LayerKind,
  PollutantKey,
  SetValueConfig,
} from '@/types/domain';
import type { SelectedLayer } from '@/types/map';
import type { HeatLayerResult } from '@/utils/createMap';
import {
  createBaseLayer,
  createCityBoundaries,
  mapCities,
  mapSensorsInCities,
  removeLayer,
} from '@/utils/createMap';

import Filters from './Filters.vue';

type LayerFactory = (
  map: LeafletMap,
  options: SelectedLayer & { time: number }
) => HeatLayerResult;

/**
 * The three factories take structurally different option objects -- one wants
 * `city` plus `sensorId`, two want `cities` -- so indexing them with a runtime
 * LayerKind and passing one merged shape is not something the compiler can
 * verify. This single cast records the contract the .js relied on implicitly,
 * instead of an `as never` at each of the two call sites.
 */
const createLayer = CreateLayer as unknown as Record<LayerKind, LayerFactory>;

/**
 * Re-asserts a Leaflet instance's own type after Vue's reactive typing.
 *
 * Vue maps a class instance held in `data()` through its reactive unwrapping
 * types, which rebuild it structurally and drop private members. Leaflet's `Map`
 * has private members, so `this.map` stops satisfying Leaflet's own `Map`
 * parameter type despite being exactly that at runtime -- fifteen call sites
 * would otherwise each need a cast.
 *
 * Module-scope rather than a computed or a method, deliberately: it adds nothing
 * to the component's public instance, so no spec sees a new property.
 *
 * Worth doing properly later: storing the map with `markRaw()` fixes this at the
 * root and stops Vue deep-proxying a Leaflet instance, which is a known
 * Leaflet/Vue hazard in its own right. That is a runtime change, so it is not
 * being made inside a type migration.
 */
function asMap(map: unknown): LeafletMap {
  return map as LeafletMap;
}

export default defineComponent({
  name: 'Map',

  components: {
    Filters,
  },

  // Every field here was `null`, which TypeScript infers as the type `null` --
  // so each later assignment of a real Leaflet object was an error. The
  // annotations describe what actually gets stored.
  //
  // `map` is non-null from mounted() onwards but null before it, and the methods
  // below dereference it unguarded, exactly as they always have. The
  // assertions at those call sites record that rather than adding guards that
  // would change behaviour on a path that cannot occur (no method here runs
  // before mount).
  data() {
    return {
      map: null as LeafletMap | null,
      slider: 0,
      polygons: null as Polygon[] | null,
      selected: null as SelectedLayer | null,
      heatLayers: null as HeatLayer[] | null,
      cityMarkers: null as Marker[] | null,
      sensorMarkers: null as Marker[] | null,
    };
  },

  computed: {
    ...mapStores(useAirPollutionStore),

    store() {
      return this.airPollutionStore;
    },
    mapStyle() {
      return {
        height: belowAppBar(),
        width: '100%',
        zIndex: 1,
      };
    },
    allCities() {
      return this.store.cities ? Object.values(this.store.cities) : [];
    },
    sliderValid() {
      return !!this.store.pollutantInput.value;
    },
  },

  beforeMount() {
    this.store.initMapPage();
  },

  mounted() {
    window.scrollTo(0, 0);

    this.map = L.map('map').setView(MACEDONIA_COORDINATES, MIN_ZOOM);

    createBaseLayer(asMap(this.map));
    this.cityMarkers = mapCities(asMap(this.map), this.allCities);
  },

  // Vue 3 renamed beforeDestroy to beforeUnmount. Left unrenamed, the map
  // instance is never torn down and leaks on every tab switch.
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  },

  methods: {
    scrollDown() {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    },

    async setName(config: SetValueConfig) {
      await this.store.setValue(config);
      if (!config.value) {
        return;
      }

      const city = this.store.cities[config.value as string];
      if (!city) {
        return;
      }

      // Same string-coordinate story as createMap's asLatLng: borders are
      // string pairs straight from the API and Leaflet coerces them. Asserted,
      // not converted.
      asMap(this.map).fitBounds(city.borders as unknown as LatLngBoundsExpression);
    },

    async setPollutant(config: SetValueConfig) {
      this.heatLayers = removeLayer(asMap(this.map), this.heatLayers);

      await this.store.setValue(config);
      if (!config.value) {
        return;
      }

      if (this.store.showForAllCitiesInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value as PollutantKey,
          selected: Layers.AllCities,
        };
      } else if (this.store.showForAllSensorsInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value as PollutantKey,
          selected: Layers.AllSensors,
        };
      } else {
        this.selected = {
          city: this.store.cities[this.store.nameInput.value as string],
          pollutant: config.value as PollutantKey,
          sensorId: this.store.sensorInput.value as string,
          selected: Layers.SelectedSensor,
        };
      }
      const conf = createLayer[this.selected.selected](asMap(this.map), {
        ...this.selected,
        time: this.slider,
      });
      this.selected = {
        ...this.selected,
        selectedTime: conf.time,
      };
      this.heatLayers = [conf.heatLayer];
    },

    async changeBoundaries(config: SetValueConfig) {
      await this.store.setValue(config);

      if (config.value) {
        this.polygons = createCityBoundaries(asMap(this.map), this.allCities);
      } else {
        this.polygons = removeLayer(asMap(this.map), this.polygons);
      }
    },

    async changeCityMarkers(config: SetValueConfig) {
      await this.store.setValue(config);

      if (config.value) {
        this.cityMarkers = mapCities(asMap(this.map), this.allCities);
      } else {
        this.cityMarkers = removeLayer(asMap(this.map), this.cityMarkers);
      }
    },

    async setShowForAllCities(config: SetValueConfig) {
      await this.store.setValue(config);
      this.heatLayers = removeLayer(asMap(this.map), this.heatLayers);
    },

    async setShowForAllSensors(config: SetValueConfig) {
      await this.store.setValue(config);
      this.heatLayers = removeLayer(asMap(this.map), this.heatLayers);
    },

    async changeSensorMarkers(config: SetValueConfig) {
      await this.store.setValue(config);

      if (config.value) {
        // No cast needed: mapSensorsInCities takes `sensors` as optional, which
        // is what it is on City, and skips a city whose sensors have not loaded
        // yet. This used to assert the field present to preserve a TypeError on
        // exactly the path this toggle reaches.
        this.sensorMarkers = mapSensorsInCities(asMap(this.map), this.allCities);
      } else {
        this.sensorMarkers = removeLayer(asMap(this.map), this.sensorMarkers);
      }
    },

    sliderChange(time: number) {
      this.heatLayers = removeLayer(asMap(this.map), this.heatLayers);

      const conf = createLayer[this.selected!.selected](asMap(this.map), {
        ...this.selected!,
        time,
      });
      this.selected = {
        ...this.selected!,
        selectedTime: conf.time,
      };
      this.heatLayers = [conf.heatLayer];
    },
  },
});
</script>
