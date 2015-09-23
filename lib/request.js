var chalk = require('chalk');
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
    //Encode and limit file names to 200 characters
    return encodeURIComponent(method + '::' + uri + '::' + authorization).substring(0, 200);
};
var setCache = function (key, code, headers, body) {
    cache.set(key, {
        code: code,
        headers: headers,
        body: body
    });
};
var log = function (method, uri, code, loadtime, fromCache) {
    var timestamp = (new Date().toISOString()).replace(/^(\d{4})\-(\d{2})\-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})(.*?)$/, '$1-$2-$3 $4:$5:$6');
    var endpoint = uri.split('/api')[1].split('?')[0];

    var msg = '';
    msg += chalk.gray(timestamp) + ' ';
    msg += chalk.bold(method + ' ' + endpoint) + ': ';
    if (code >= 200 && code < 400) {
        msg += chalk.green(code)
    } else {
        msg += chalk.red(code);
    }
    msg += ' in ' + loadtime + ' ms';

    if (fromCache) {
        msg = chalk.bgBlue(msg + ' (cached)');
    }

    console.log(msg);
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
                log(method, url, data.code, Date.now() - start, true);
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
        log(method, url, res.statusCode, Date.now() - start);
        delete res.headers['content-encoding'];
        callback(res.statusCode, res.headers, body);
    });
};
