const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const url = require("url");

app.get('/', function (req, res) {
  console.log("/ ", req.path);

  res.sendFile(path.join(__dirname + "/KMLParser.html"));
});

app.get('/script', function (req, res) {
  console.log(req.query.file);
  let fileName = req.query.file;

  console.log("/script ", fileName);
  res.sendFile(path.join(__dirname + "/script/" + fileName), {
    "content-type": "application/javascript"
  });
});

app.get('/files', function (req, res) {
  console.log(req.query.file);
  let fileName = req.query.file;

  console.log("/files ", fileName);
  res.sendFile(path.join(__dirname + "/files/" + fileName));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));