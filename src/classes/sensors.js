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
      description,
    } = sensor;

    return new Sensor({
      type,
      status,
      cityName,
      sensorId,
      position: formatPosition(position),
      comments,
      description,
    });
  }
}

function formatPosition(position) {
  // A sensor with no position used to throw here, one guard away from the
  // `if (!sensor) return null` above. city.js handles the same case by
  // returning an empty coordinate pair; match it.
  if (!position) {
    return [];
  }

  return position.split(',');
}
