export const Pollutants = {
  aqi: 'aqi',
  co: 'co',
  nh3: 'nh3',
  no: 'no',
  no2: 'no2',
  o3: 'o3',
  pm2_5: 'pm2_5',
  pm10: 'pm10',
  so2: 'so2',
};

export const PollutantsLabels = {
  [Pollutants.aqi]: 'AQI',
  [Pollutants.co]: 'CO',
  [Pollutants.nh3]: 'NH3',
  [Pollutants.no]: 'NO',
  [Pollutants.no2]: 'NO2',
  [Pollutants.o3]: 'O3',
  [Pollutants.pm2_5]: 'PM2.5',
  [Pollutants.pm10]: 'PM10',
  [Pollutants.so2]: 'SO2',
};

export const PollutantRatio = {
  [Pollutants.aqi]: 30,
  [Pollutants.co]: 50,
  [Pollutants.nh3]: 1,
  [Pollutants.no]: 1,
  [Pollutants.no2]: 1000,
  [Pollutants.o3]: 800,
  [Pollutants.pm2_5]: 800,
  [Pollutants.pm10]: 1200,
  [Pollutants.so2]: 1250,
};
