const fetch = require("node-fetch");
const $ = require("cheerio");
const express = require("express");
const pug = require("pug");
const regions = require("./regions.json");
const regionsFunction = pug.compileFile("./regions.pug");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static("assets"));

app.get("/", (req, res) => {
  res.send(regionsFunction({ regions }));
});

app.get("/:region", (req, res) => {
  fetchAndSendResult(req, res);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

const fetchAndSendResult = (req, res) => {
  const region = req.params.region || "mia";
  fetch(
    `https://aviationweather.gov/windtemp/data?level=low&fcst=06&region=${region}&layout=off&date=`
  )
    .then(response => response.text())
    .then(html => parse(html))
    .then(data => res.send(JSON.stringify(data, null, 2)));
};

const parse = html => {
  let data = parseText(extractText(html));
  data.dataRows.pop(); // junk row
  data.dataRows = mapByCity(data.dataRows);
  data.dataRows = addReadableForecasts(data.dataRows);
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

const mapByCity = dataRows => {
  return dataRows.map(row => {
    [city, ...rest] = [...row.split(/\s/)];
    return { city, rawForecast: rest.slice(0, 4) };
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
