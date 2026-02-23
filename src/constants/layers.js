import {
  createHeatLayer,
  createHeatLayers,
  createSensorHeatLayers,
} from '@/utils/createMap';

export const Layers = {
  AllCities: 'AllCities',
  AllSensors: 'AllSensors',
  SelectedSensor: 'SelectedSensor',
};

export const CreateLayer = {
  [Layers.AllCities]: (map, selected) => createHeatLayers(map, selected),
  [Layers.AllSensors]: (map, selected) => createSensorHeatLayers(map, selected),
  [Layers.SelectedSensor]: (map, selected) => createHeatLayer(map, selected),
};
