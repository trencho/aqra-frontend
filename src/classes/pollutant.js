export class Pollutant {
  /**
   * Pollutant config
   *
   * @param {Object}                    config
   * @param {String}                    config.name
   * @param {String}                    config.value
   */

  constructor(config) {
    this.name = config.name;
    this.value = config.value;
  }

  static fromApi(pollutant) {
    if (!pollutant) {
      return null;
    }

    const { name, value } = pollutant;

    return new Pollutant({
      name,
      value,
    });
  }
}
