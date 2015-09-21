var fs = require('fs');

var Cache = function (dir) {
    this.dir = './' + dir + '/';
    try {
        var stats = fs.lstatSync(this.dir);
        if (!stats.isDirectory()) {
            fs.mkdirSync(this.dir);
        }
    } catch (e) {
        fs.mkdirSync(this.dir);
    }
};

Cache.prototype.get = function (key) {
    var path = this.dir + key;
    try {
        var stats = fs.lstatSync(path);

        if (stats.isFile()) {
            return fs.readFileSync(path, 'utf8');
        }
    } catch (e) {}

    return false;
};

Cache.prototype.set = function (key, value) {
    fs.writeFileSync(this.dir + key, value, 'utf8');
};

Cache.prototype.unset = function (key) {
    fs.unlinkSync(this.dir + key);
};

module.exports = new Cache('cache');
