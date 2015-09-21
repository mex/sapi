var request = require('request');
var zlib = require('zlib');
var cache = require('./cache');

var generateKey = function (method, url, headers) {
    //Remove timestamp and seed query params
    var uri = url.replace(/^https?:\/\/([a-z-]+\.)?fitbay\.com/, '');
    uri = uri.replace(/(&|\?)_=[0-9]+/, '');
    uri = uri.replace(/(&|\?)seed=[0-9]+/, '');

    //Remove timestamp from authorization header
    var authorization = headers.authorization;
    if (authorization) {
        authorization = headers.authorization.split(':')[0];
    }
    return encodeURIComponent(method + '::' + uri + '::' + authorization);
};
var setCache = function (key, code, headers, body) {
    cache.set(key, {
        code: code,
        headers: headers,
        body: body
    });
};
var log = function (method, uri, code, msg) {
    console.log(method + ' ' + uri.split('?')[0] + ': ' + msg + ' (' + code + ')');
};

module.exports = function (method, url, headers, payload, callback) {
    var start = Date.now();

    request({
        method: method,
        url: url,
        headers: headers,
        body: payload,
        rejectUnauthorized: false,
        encoding: null
    }, function (err, res, body) {
        if (err) {
            return callback(500, {}, '');
        }

        //Unzip body
        var encoding = res.headers['content-encoding'];
        if (encoding && encoding.indexOf('gzip') !== -1 && body) {
            body = zlib.unzipSync(body).toString();
        }

        var key = generateKey(method, url, headers);
        //Backend is failing, try to fix it
        if (res.statusCode === 503) {
            //Check cache
            var data = cache.get(key);
            if (data) {
                data = JSON.parse(data);
                //Return from cache
                log(method, url, data.code, 'From cache (in ' + (Date.now() - start) + ' ms)');
                delete data.headers['content-encoding'];
                return callback(data.code, data.headers, data.body);
            }
        } else {
            //Add to cache
            cache.set(key, JSON.stringify({
                code: res.statusCode,
                headers: res.headers,
                body: body
            }));
        }

        //Return from server
        log(method, url, res.statusCode, 'From server (in ' + (Date.now() - start) + ' ms)');
        delete res.headers['content-encoding'];
        callback(res.statusCode, res.headers, body);
    });
};
