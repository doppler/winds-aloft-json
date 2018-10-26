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

app.get("/:region/:station?", (req, res) => {
  windsAloftJSON(req).then(data => {
    // res.send(JSON.stringify(data, undefined, 2));
    const jsonHTML = jsonMarkup(data);
    res.send(jsonPage({ jsonHTML }));
  });
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
