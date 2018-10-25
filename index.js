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
  let cityAndRawForecast = { city, rawForecast: rest };
  return cityAndRawForecast;
};

const humanizeForecast = cityAndRawForecast => {
  cityAndRawForecast.rawForecast.map((forecast, index) => {
    const out = {
      direction: Number(forecast.slice(0, 2)) * 10,
      speed: Number(forecast.slice(2, 4)),
      temperature: Number(forecast.slice(4, 7))
    };
    if (index > 5) {
      out.temperature = -out.temperature;
    }
    console.log(forecast);
    console.log(out);
  });
};
const parse = html => {
  let parsedRows = parseRows(extractText(html));
  const cities = [];
  parsedRows.forecasts.map(line => {
    let cityAndRawForecast = parseLineToCityAndRawData(line);
    humanizeForecast(cityAndRawForecast);
    cities.push(parseLineToCityAndRawData(line));
  });
  // console.log(cities);
};
