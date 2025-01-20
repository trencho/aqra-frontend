export class Sensor {
    /**
     * Sensor config
     *
     * @param {Object}                    config
     * @param {String}                    config.type
     * @param {String}                    config.status
     * @param {String}                    config.cityName
     * @param {String}                    config.sensorId
     * @param {String}                    config.position
     * @param {String}                    config.comments
     * @param {String}                    config.description
     */

    constructor(config) {
        this.type = config.type;
        this.status = config.status;
        this.cityName = config.cityName;
        this.sensorId = config.sensorId;
        this.position = config.position;
        this.comments = config.comments;
        this.description = config.description;
    }

    static fromApi(sensor) {
        if (!sensor) {
            return null;
        }

        const {
            type,
            status,
            cityName,
            sensorId,
            position,
            comments,
            description
        } = sensor;

        return new Sensor({
            type,
            status,
            cityName,
            sensorId,
            position: formatPosition(position),
            comments,
            description
        });
    }
}

function formatPosition(position) {
    return position.split(',');
}