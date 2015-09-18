var express = require('express');
var bodyParser = require('body-parser');
var request = require('./lib/request');

var app = express();
app.use(bodyParser.json());

app.all('*', function (req, res) {
    var body = req.body !== {} ? JSON.stringify(req.body) : undefined;
    request(req.method, req.url, req.headers, body, function (code, headers, response) {
        res.set(headers).status(code).send(response);
    });
});

app.listen(8008);
