import type { ApiPollutant } from '@/types/api';

export interface PollutantConfig {
  name: string | undefined;
  value: string | number | undefined;
}

export class Pollutant {
  name: string | undefined;
  value: string | number | undefined;

  constructor(config: PollutantConfig) {
    this.name = config.name;
    this.value = config.value;
  }

  static fromApi(pollutant?: ApiPollutant | null): Pollutant | null {
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
