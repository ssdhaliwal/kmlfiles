const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + "/KMLParser.html"));
});

app.get('/files', function (req, res) {
  console.log(req.query.file);
  let fileName = req.query.file;

  console.log("1001-01", fileName);
  res.sendFile(path.join(__dirname + "/files/" + fileName));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));