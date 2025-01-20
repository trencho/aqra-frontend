<template>
  <div>
    <div
      id="map"
      :style="'height: calc(100vh - ' + $vuetify.application.top + 'px); width: 100%, z-index=1'"
    />
    <div class="hidden-sm-and-down">
      <Filters
        class="filterLarge"
        :selected="selected"
      
        @setName="setName"
        @setValue="setValue"
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
        dark
        fab
        class="scrollButton"
        @click="$vuetify.goTo(500)"
      >
        <v-icon
          color="white"
        >
          mdi-chevron-down
        </v-icon>
      </VBtn>
      <Filters
        :selected="selected"
      
        @setName="setName"
        @setValue="setValue"
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
import {mapActions, mapState} from 'vuex';

import L from 'leaflet';

import Filters from './Filters';

import {MACEDONIA_COORDINATES, MIN_ZOOM} from '@/constants/map';
import {CreateLayer, Layers} from '@/constants/layers';
import {createBaseLayer, createCityBoundaries, mapCities, mapSensorsInCities, removeLayer,} from '@/utils/createMap';

export default {
  name: 'Map',

  components: {
    Filters
  },

  data() {
    return {
      map: null,
      slider: 0,
      drawer: true,
      polygons: null,
      selected: null,
      interval: null,
      heatLayers: null,
      isPlaying: false,
      cityMarkers: null,
      sensorMarkers: null,
    }
  },

  computed: {
    ...mapState('airPollution', [
      'cities',
      'nameInput',
      'sensorInput',
      'pollutantInput',
      'showCityMarkersInput',
      'showForAllCitiesInput',
      'showSensorMarkersInput',
      'showForAllSensorsInput',
      'showCityBoundariesInput',
    ]),
    allCities() {
      return this.cities ? Object.values(this.cities) : [];
    },
    sliderValid() {
      return !!this.pollutantInput.value;
    }
  },

  beforeMount() {
    this.initMapPage();
  },

  mounted() {
    window.scrollTo(0, 0);

    this.map = L.map('map').setView(MACEDONIA_COORDINATES, MIN_ZOOM);

    createBaseLayer(this.map);
    this.cityMarkers = mapCities(this.map, this.allCities);
  },

  beforeDestroy() {
    if (this.map) {
      this.map.remove();
    }
  },

  methods: {
    ...mapActions('airPollution', ['setValue', 'initMapPage']),

    async setName(config) {
      await this.setValue(config);
      if (!config.value) {
        return;
      }

      const city = this.cities[config.value];
      if (!city) {
        return;
      }

      this.map.fitBounds(city.borders);
    },

    async setPollutant(config) {
      this.heatLayers = removeLayer(this.map, this.heatLayers);

      await this.setValue(config);
      if (!config.value) {
        return;
      }

      if (this.showForAllCitiesInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value,
          selected: Layers.AllCities
        };
      } else if (this.showForAllSensorsInput.value) {
        this.selected = {
          cities: this.allCities,
          pollutant: config.value,
          selected: Layers.AllSensors
        };
      } else {
        this.selected = {
          city: this.cities[this.nameInput.value],
          pollutant: config.value,
          sensorId: this.sensorInput.value,
          selected: Layers.SelectedSensor
        };
      }
      const conf = CreateLayer[this.selected.selected](this.map, {...this.selected, time: this.slider});
      this.selected = {
        ...this.selected,
        selectedTime: conf.time
      };
      this.heatLayers = [conf.heatLayer];
    },

    async changeBoundaries(config) {
      await this.setValue(config);

      if (config.value) {
        this.polygons = createCityBoundaries(this.map, this.allCities);
      } else {
        this.polygons = removeLayer(this.map, this.polygons);
      }
    },

    async changeCityMarkers(config) {
      await this.setValue(config);

      if (config.value) {
        this.cityMarkers = mapCities(this.map, this.allCities);
      } else {
        this.cityMarkers = removeLayer(this.map, this.cityMarkers);
      }
    },

    async setShowForAllCities(config) {
      await this.setValue(config);
      this.heatLayers = removeLayer(this.map, this.heatLayers);
    },

    async setShowForAllSensors(config) {
      await this.setValue(config);
      this.heatLayers = removeLayer(this.map, this.heatLayers);
    },

    async changeSensorMarkers(config) {
      await this.setValue(config);

      if (config.value) {
        this.sensorMarkers = mapSensorsInCities(this.map, this.allCities);
      } else {
        this.sensorMarkers = removeLayer(this.map, this.sensorMarkers);
      }
    },

    toggleDrawer() {
      this.drawer = !this.drawer;
    },

    decrement() {
      this.sliderChange(this.slider--);
    },

    increment() {
      if (this.slider === 23) {
        this.slider = 0;
        return;
      }

      this.sliderChange(this.slider++);
    },

    sliderChange(time) {
      this.heatLayers = removeLayer(this.map, this.heatLayers);

      const conf = CreateLayer[this.selected.selected](this.map, {...this.selected, time});
      this.selected = {
        ...this.selected,
        selectedTime: conf.time
      };
      this.heatLayers = [conf.heatLayer];
    },

    playSlider() {
      this.isPlaying = !this.isPlaying;

      if (this.isPlaying) {
        this.interval = setInterval(this.increment, 500);
      } else {
        clearInterval(this.interval);
      }
    }
  }
};
</script>