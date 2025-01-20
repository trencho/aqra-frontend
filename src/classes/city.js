export class City {
    /**
     * City config
     *
     * @param {{siteUrl, cityName, borders: *, countryCode, siteTitle, siteName, countryName, initialZoomLevel, position: ([]|[number,*])}}                    config
     * @param {String}                    config.borders
     * @param {String}                    config.siteUrl
     * @param {String}                    config.cityName
     * @param {String}                    config.siteName
     * @param {String}                    config.position
     * @param {String}                    config.siteTitle
     * @param {String}                    config.countryCode
     * @param {String}                    config.countryName
     * @param {String}                    config.initialZoomLevel
     */

    constructor(config) {
        this.borders = config.borders;
        this.siteUrl = config.siteUrl;
        this.cityName = config.cityName;
        this.siteName = config.siteName;
        this.position = config.position;
        this.siteTitle = config.siteTitle;
        this.countryCode = config.countryCode;
        this.countryName = config.countryName;
        this.initialZoomLevel = config.initialZoomLevel;
    }

    static fromApi(city) {
        if (!city) {
            return null;
        }

        const {
            siteUrl,
            cityName,
            siteName,
            siteTitle,
            countryCode,
            countryName,
            cityLocation,
            initialZoomLevel,
            cityBorderPoints
        } = city;

        return new City({
            cityName,
            siteUrl,
            siteName,
            siteTitle,
            countryCode,
            countryName,
            initialZoomLevel,
            position: mapLocationCoordinates(cityLocation),
            borders: mapBorders(cityBorderPoints)
        });
    }
}

function mapLocationCoordinates(cityLocation) {
    if (!cityLocation) {
        return [];
    }

    return [cityLocation.latitude, cityLocation.longitute];
}

function mapBorders(borders) {
    return (borders || []).map(s => mapLocationCoordinates(s));
}