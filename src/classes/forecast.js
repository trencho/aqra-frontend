import moment from 'moment-timezone';

export class Forecast {
  /**
   * Forecast config
   *
   * @param {Object}                    config
   * @param {Array}                     config.position
   * @param {Array}                     config.data
   */

  constructor(config) {
    this.data = config.data;
    this.position = config.position;
  }

  // Refactor to map API response to Forecast class
  static fromApi(city) {
    if (!city) {
      return null;
    }

    const { data, latitude, longitude } = city;

    return new Forecast({
      // mapData() guarded its argument; these two did not, one line apart, so
      // a record missing either coordinate threw.
      position: mapPosition(latitude, longitude),
      data: mapData(data),
    });
  }
}

function mapPosition(latitude, longitude) {
  if (latitude === null || latitude === undefined) {
    return [];
  }
  if (longitude === null || longitude === undefined) {
    return [];
  }

  return [latitude.toString(), longitude.toString()];
}

function mapData(data) {
  if (!data) {
    return [];
  }

  return data.map((d) => ({
    ...d,
    time: moment.unix(d.time).tz('UTC').format('DD/MM/YYYY HH:mm'),
  }));
}
