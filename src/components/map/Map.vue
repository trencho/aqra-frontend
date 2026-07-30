<template>
  <div>
    <div
      id="map"
      :style="mapStyle"
    />
    <div class="hidden-sm-and-down">
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
    <div class="hidden-md-and-up">
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

<script>
import L from 'leaflet';
import { mapStores } from 'pinia';

import { CreateLayer, Layers } from '@/constants/layers';
import { belowAppBar } from '@/constants/layout';
import { MACEDONIA_COORDINATES, MIN_ZOOM } from '@/constants/map';
import { useAirPollutionStore } from '@/stores/airPollution';
import {
  createBaseLayer,
  createCityBoundaries,
  mapCities,
  mapSensorsInCities,
  removeLayer,
} from '@/utils/createMap';

import Filters from './Filters.vue';

export default {
  name: 'Map',

  components: {
    Filters,
  },

  data() {
    return {
      map: null,
      slider: 0,
      polygons: null,
      selected: null,
      heatLayers: null,
      cityMarkers: null,
      sensorMarkers: null,
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

    createBaseLayer(this.map);
    this.cityMarkers = mapCities(this.map, this.allCities);
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

    async setName(config) {
      await this.store.setValue(config);
      if (!config.value) {
        return;
      }

      const city = this.store.cities[config.value];
      if (!city) {
        return;
      }

      this.map.fitBounds(city.borders);
    },

    async setPollutant(config) {
      this.heatLayers = removeLayer(this.map, this.heatLayers);

      await this.store.setValue(config);
      if (!config.value) {
        return;
      }

      if (this.store.showForAllCitiesInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value,
          selected: Layers.AllCities,
        };
      } else if (this.store.showForAllSensorsInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value,
          selected: Layers.AllSensors,
        };
      } else {
        this.selected = {
          city: this.store.cities[this.store.nameInput.value],
          pollutant: config.value,
          sensorId: this.store.sensorInput.value,
          selected: Layers.SelectedSensor,
        };
      }
      const conf = CreateLayer[this.selected.selected](this.map, {
        ...this.selected,
        time: this.slider,
      });
      this.selected = {
        ...this.selected,
        selectedTime: conf.time,
      };
      this.heatLayers = [conf.heatLayer];
    },

    async changeBoundaries(config) {
      await this.store.setValue(config);

      if (config.value) {
        this.polygons = createCityBoundaries(this.map, this.allCities);
      } else {
        this.polygons = removeLayer(this.map, this.polygons);
      }
    },

    async changeCityMarkers(config) {
      await this.store.setValue(config);

      if (config.value) {
        this.cityMarkers = mapCities(this.map, this.allCities);
      } else {
        this.cityMarkers = removeLayer(this.map, this.cityMarkers);
      }
    },

    async setShowForAllCities(config) {
      await this.store.setValue(config);
      this.heatLayers = removeLayer(this.map, this.heatLayers);
    },

    async setShowForAllSensors(config) {
      await this.store.setValue(config);
      this.heatLayers = removeLayer(this.map, this.heatLayers);
    },

    async changeSensorMarkers(config) {
      await this.store.setValue(config);

      if (config.value) {
        this.sensorMarkers = mapSensorsInCities(this.map, this.allCities);
      } else {
        this.sensorMarkers = removeLayer(this.map, this.sensorMarkers);
      }
    },

    sliderChange(time) {
      this.heatLayers = removeLayer(this.map, this.heatLayers);

      const conf = CreateLayer[this.selected.selected](this.map, {
        ...this.selected,
        time,
      });
      this.selected = {
        ...this.selected,
        selectedTime: conf.time,
      };
      this.heatLayers = [conf.heatLayer];
    },
  },
};
</script>
