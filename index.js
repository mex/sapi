var express = require('express');
var bodyParser = require('body-parser');
var request = require('./lib/request');

var app = express();
app.use(bodyParser.json({limit: '50mb'}));

var environment = process.argv[2] || 'testing';

app.all('*', function (req, res) {
    var url = 'https://' + (environment !== 'live' ? environment + '.' : '') + 'fitbay.com' + req.url;
    var body = req.body !== {} ? JSON.stringify(req.body) : undefined;
    request(req.method, url, req.headers, body, function (code, headers, response) {
        res.set(headers).status(code).send(response);
    });
});

app.listen(8008);
