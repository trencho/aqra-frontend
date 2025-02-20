import { TabIds } from "@/constants/navigationTabs";

export const state = {
    drawer: false,

    cities: {},
    nameInput: {},
    sensorInput: {},
    historyData: {},
    pollutantInput: {},
    tabId: TabIds.Home,
    forecastBySensorId: {},
    pollutantsBySensorId: {},
    showCityMarkersInput: {},
    showForAllCitiesInput: {},
    showSensorMarkersInput: {},
    showForAllSensorsInput: {},
    showCityBoundariesInput: {},
};