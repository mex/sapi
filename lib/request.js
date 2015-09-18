var request = require('request');
var zlib = require('zlib');
var cache = require('./cache');

var generateKey = function (method, uri, headers) {
    return method + '::' + uri + '::' + headers.authorization.split(':')[0];
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

module.exports = function (method, uri, headers, payload, callback) {
    //Remove timestamp and seed query params
    uri = uri.replace(/(&|\?)_=[0-9]+/, '');
    uri = uri.replace(/(&|\?)seed=[0-9]+/, '');

    request({
        method: method,
        url: 'https://testing.fitbay.com' + uri,
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

        var key = generateKey(method, uri, headers);
        //Backend is failing, try to fix it
        if (res.statusCode === 503) {
            //Check cache
            var data = cache.get(key);
            if (data) {
                //Return from cache
                log(method, uri, data.code, 'From cache');
                delete data.headers['content-encoding'];
                return callback(data.code, data.headers, data.body);
            }
        } else {
            //Ad to cache
            cache.set(key, {
                code: res.statusCode,
                headers: res.headers,
                body: body
            });
        }

        //Return from server
        log(method, uri, res.statusCode, 'From server');
        delete res.headers['content-encoding'];
        callback(res.statusCode, res.headers, body);
    });
};
