const fetch = require("node-fetch");
const $ = require("cheerio");

fetch(
  "https://aviationweather.gov/windtemp/data?level=low&fcst=06&region=mia&layout=on&date="
)
  .then(response => response.text())
  .then(html => parse(html));

const extractText = html => {
  return $("pre", html).text();
};

const parseRows = text => {
  const rows = text.split(/\n/);
  [extFromLine, notSure, dataBasedOnLine, validFromLine, _, keys, ...rest] = [
    ...rows
  ];
  return {
    extFromLine,
    notSure,
    dataBasedOnLine,
    validFromLine,
    keys,
    forecasts: rest
  };
};

const parseLineToCityAndRawData = line => {
  const d = line.split(/\s/);
  [city, ...rest] = [...d];
  let cityAndRawForecast = {
    city,
    rawForecast: rest.slice(0, 4) /* only interested in first 4 altitudes */
  };
  return cityAndRawForecast;
};

// const humanizeForecast = cityAndRawForecast => {
//   cityAndRawForecast.rawForecast.map((forecast, index) => {
//     const out = {
//       direction: Number(forecast.slice(0, 2)) * 10,
//       speed: Number(forecast.slice(2, 4)),
//       temperature: Number(forecast.slice(4, 7))
//     };
//     if (index > 5) {
//       out.temperature = -out.temperature;
//     }
//     console.log(forecast);
//     console.log(out);
//   });
// };

const parse = html => {
  let parsedRows = parseRows(extractText(html));
  const cities = parsedRows.forecasts.map(line => {
    return parseLineToCityAndRawData(line);
  });
  humanizeForecast(cities);
};

const humanizeForecast = cities => {
  const citiesWithHumanizedForecasts = cities.map(city => {
    city.furecast = parseForecasts(city.rawForecast);
    return city;
  });
  const atl = citiesWithHumanizedForecasts.find(city => city.city === "ATL");
  console.log(JSON.stringify(atl, null, 2));
};

const parseForecasts = forecasts => {
  return forecasts.map((forecast, i) => {
    let altitude;
    switch (i) {
      case 0:
        altitude = 3000;
        break;
      case 1:
        altitude = 6000;
        break;
      case 2:
        altitude = 9000;
        break;
      case 3:
        altitude = 12000;
        break;
    }
    let speed = {
      knots: Number(forecast.slice(2, 4))
    };
    speed.mph = Math.round(speed.knots * 1.151);
    let temperature = {
      celsius: Number(forecast.slice(4, 7))
    };
    temperature.farenheit = Math.round((temperature.celsius * 9) / 5 + 32);
    return {
      altitude: altitude,
      direction: Number(forecast.slice(0, 2)) * 10,
      speed,
      temperature
    };
  });
};
