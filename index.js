var express = require('express');
var bodyParser = require('body-parser');
var request = require('./lib/request');

var app = express();
app.use(bodyParser.json({limit: '50mb'}));

var environment = process.argv[2];
if (['staging', 'production'].indexOf(environment) === -1) {
    environment = 'testing';
}

app.all('*', function (req, res) {
    if (!req.url.match(/^\/api/)) {
        //Ignore non-API request
        return;
    }
    var url = 'https://' + (environment !== 'production' ? environment + '.' : '') + 'fitbay.com' + req.url;
    var body = req.body !== {} ? JSON.stringify(req.body) : undefined;
    request(req.method, url, req.headers, body, function (code, headers, response) {
        res.set(headers).status(code).send(response);
    });
});

app.listen(8008);
