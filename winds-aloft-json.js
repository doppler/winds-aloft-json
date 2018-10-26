const fetch = require("node-fetch");
const $ = require("cheerio");

const cacheManager = require("cache-manager");
const memoryCache = cacheManager.caching({
  store: "memory",
  max: 100,
  ttl: 60 * 60 /* 1 hour */
});

module.exports = (req, res) => {
  const region = req.params.region;
  const station = req.params.station;

  memoryCache
    .wrap(region, () => {
      return fetch(
        `https://aviationweather.gov/windtemp/data?level=low&fcst=06&region=${region}&layout=off&date=`
      ).then(response => response.text());
    })
    .then(html => parse(html, station))
    .then(data => res.send(JSON.stringify(data, null, 2)));
};

const parse = (html, station) => {
  let data = parseText(extractText(html));
  data.dataRows.pop(); // junk row
  data.dataRows = mapByStation(data.dataRows);
  data.dataRows = addReadableForecasts(data.dataRows);
  if (station) {
    data.dataRows = data.dataRows.filter(row => row.station === station);
  }
  return data;
};

const extractText = html => {
  return $("pre", html).text();
};

const parseText = text => {
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
    dataRows: rest
  };
};

const mapByStation = dataRows => {
  return dataRows.map(row => {
    [station, ...rest] = [...row.split(/\s/)];
    return { station, rawForecast: rest.slice(0, 4) };
  });
};

const addReadableForecasts = dataRows => {
  return dataRows.map(row => {
    return {
      ...row,
      forecast: parseForecast(row.rawForecast)
    };
  });
};

const parseForecast = rawForecast => {
  return rawForecast
    .map((altitudeForecast, i) => {
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
      return {
        altitudeForecast,
        altitude: altitude,
        direction: getDirection(altitudeForecast),
        speed: getSpeed(altitudeForecast),
        temperature: getTemperature(altitudeForecast)
      };
    })
    .reverse();
};

const getDirection = altitudeForecast => {
  let dirVal = Number(altitudeForecast.slice(0, 2)) * 10;
  if (dirVal === 990) {
    dirVal = "L/V";
  } else if (dirVal > 400) {
    dirVal = dirVal - 500;
  }
  return dirVal;
};

const getSpeed = altitudeForecast => {
  const dirVal = Number(altitudeForecast.slice(0, 2)) * 10;
  let knots = Number(altitudeForecast.slice(2, 4));
  if (dirVal > 400) {
    knots += 100;
  }
  if (dirVal === 990) {
    knots = 0;
  }
  return {
    knots,
    mph: Math.round(knots * 1.151)
  };
};

const getTemperature = altitudeForecast => {
  let celsius = Number(altitudeForecast.slice(4, 7));
  return {
    celsius,
    farenheit: Math.round((celsius * 9) / 5 + 32)
  };
};
