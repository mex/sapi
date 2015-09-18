var low = require('lowdb');
low.stringify = function (obj) {
    return JSON.stringify(obj);
};

var Cache = function (filename) {
    this.db = low('./' + filename);
};

Cache.prototype.get = function (key) {
    var data = this.db('payloads').find({ key: key });

    if (data) {
        return data.value;
    }

    return false;
};

Cache.prototype.set = function (key, value) {
    this.unset(key);

    this.db('payloads').push({
        key: key,
        value: value
    });
};

Cache.prototype.unset = function (key) {
    this.db('payloads').remove({ key: key });
};

module.exports = new Cache('cache.json');