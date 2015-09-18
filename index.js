var express = require('express');
var bodyParser = require('body-parser');
var request = require('./lib/request');

var app = express();
app.use(bodyParser.text());

app.get('*', function (req, res) {
    var body;
    if (req.body instanceof String) {
        body = req.body;
    }
    request(req.method, req.url, req.headers, body, function (code, headers, response) {
        res.set(headers).status(code).send(response);
    });
});

app.listen(8008);
