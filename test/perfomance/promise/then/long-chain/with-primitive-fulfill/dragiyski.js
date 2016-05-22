(function() {
    "use strict";
    var performance = require('../../../../../../lib/test/performance');
    var Promise = require('../../../../../..');
    var samples = 1000;
    var a = new Array(samples), i = 0, defer = function() {
        var d = {};
        d.promise = new Promise(function(resolve, reject) {
            d.resolve = resolve;
            d.reject = reject;
        });
        return d;
    };
    var deferred = defer(), promise = deferred.promise;
    performance.measure(function(done) {
        for(var it = 0; it < 50; ++it) {
            promise = promise.then(function(value) {
                return value + 1;
            });
        }
        promise.then(function(value) {
            a[i++] = value;
            done(null);
        });
        deferred.resolve(0);
    }, {
        samples: samples
    }, function(err, result) {
        if(err) {
            throw err;
        }
        performance.measure.showResult(result);
        process.exit(0);
    });
})();