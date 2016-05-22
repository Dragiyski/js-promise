(function() {
    "use strict";
    var Promise = require('../..');
    exports.resolved = function(value) {
        return new Promise(function(fulfill, reject) {
            fulfill(value);
        });
    };
    exports.rejected = function(reason) {
        return new Promise(function(fulfill, reject) {
            reject(reason);
        });
    };
    exports.deferred = function() {
        var d = {};
        d.promise = new Promise(function(fulfill, reject) {
            d.resolve = fulfill;
            d.reject = reject;
        });
        return d;
    };
})();