import L from 'leaflet';
import { mapOptions, MAX_ZOOM, MIN_ZOOM } from '@/constants/map';
import { PollutantRatio } from '@/constants/pollutants';

export function mapSensorsInCities(map, cities) {
    const markers = [];
    cities.forEach(c => Object.values(c.sensors)
        .forEach(s => {
            const marker = L.marker(s.position).addTo(map);
            marker.bindPopup(s.description);
            markers.push(marker);
        }
        ));
    return markers;
}

export function mapCities(map, cities) {
    const markers = [];
    (cities || []).forEach(s => {
        const marker = L.marker(s.position).addTo(map);
        marker.bindPopup(s.siteName);
        markers.push(marker);
    });
    return markers;
}

export function createCityBoundaries(map, cities) {
    const polygons = [];
    (cities || []).forEach(s => {
        const polygon = L.polygon(s.borders, { color: 'red' }).addTo(map);
        polygons.push(polygon);
    });
    return polygons;
}

export function removeLayer(map, layers) {
    (layers || []).forEach(l => map.removeLayer(l));
    return null;
}

export function createBaseLayer(map) {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
        id: 'map'
    }).addTo(map);
}

export function createHeatLayer(map, { city, sensorId, pollutant, time = 0 }) {
    let forecast, pollution;
    const sensor = city.sensors[sensorId];
    forecast = sensor.forecast;
    pollution = sensor.forecast.data[time][pollutant];
    map.fitBounds([sensor.forecast.position]);

    const heat = [...forecast.position, pollution / PollutantRatio[pollutant]];

    const heatLayer = L.heatLayer([heat], mapOptions).addTo(map);
    return {
        time: sensor.forecast.data.map(t => t.time),
        heatLayer
    };
}

export function createHeatLayers(map, { cities, pollutant, time = 0 }) {
    const points = cities.map(c => c.forecast?.data[time]?.[pollutant]
        ? [...c.forecast.position, c.forecast.data[time]?.[pollutant]]
        : null
    ).filter(i => i);

    const heatLayer = L.heatLayer(points, mapOptions).addTo(map);

    return {
        heatLayer,
        time: cities[0].forecast.data.map(t => t.time)
    }
}

export function createSensorHeatLayers(map, { cities, pollutant, time = 0 }) {
    const points = cities
        .map(c => Object.values(c.sensors)
            .map(s => s.forecast?.data[time]?.[pollutant]
                ? [...s.forecast.position, s.forecast.data[time]?.[pollutant]]
                : null
            ).filter(i => i)
        ).flat();

    const heatLayer = L.heatLayer(points, mapOptions).addTo(map);

    return {
        heatLayer,
        time: Object.values(cities[0].sensors)[0].forecast.data.map(t => t.time)
    };
}