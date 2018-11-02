const express = require("express");
const allowCrossDomain = require("./allow-cross-domain");
const jsonMarkup = require("json-markup");
const pug = require("pug");
const regionsWithStations = require("./regions-with-stations.json");
const regionsPage = pug.compileFile("./regionsPage.pug");
const jsonPage = pug.compileFile("./jsonPage.pug");
const getWindsAloft = require("./get-winds-aloft");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(allowCrossDomain);
app.use(express.static("assets"));

app.get("/forecast/:region.:ext?/:station?.:ext?", (req, res, next) => {
  getWindsAloft(req).then(data => {
    req.params.ext === "json"
      ? res.json(data)
      : res.send(jsonPage({ jsonHTML: jsonMarkup(data), data: data }));
  });
});

app.get("/", (req, res, next) => {
  res.send(regionsPage({ regionsWithStations }));
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
