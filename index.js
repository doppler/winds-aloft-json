const express = require("express");
const pug = require("pug");
const regions = require("./regions.json");
const regionsFunction = pug.compileFile("./regions.pug");
const windsAloftJSON = require("./winds-aloft-json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static("assets"));

app.get("/", (req, res) => {
  res.send(regionsFunction({ regions }));
});

app.get("/:region", (req, res) => {
  windsAloftJSON(req, res);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
