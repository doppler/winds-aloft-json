const express = require("express");
const jsonMarkup = require("json-markup");
const pug = require("pug");
const regions = require("./regions.json");
const regionsPage = pug.compileFile("./regionsPage.pug");
const jsonPage = pug.compileFile("./jsonPage.pug");
const windsAloftJSON = require("./winds-aloft-json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static("assets"));

app.get("/", (req, res) => {
  res.send(regionsPage({ regions }));
});

app.get("/:region.:ext?/:station?.:ext?", (req, res) => {
  console.log(req.params);
  windsAloftJSON(req).then(data => {
    req.params.ext === "json"
      ? res.json(data)
      : res.send(jsonPage({ jsonHTML: jsonMarkup(data), data: data }));
  });
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
