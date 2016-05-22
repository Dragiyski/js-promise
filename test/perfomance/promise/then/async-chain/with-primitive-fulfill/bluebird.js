(function() {
    "use strict";
    var performance = require('../../../../../../lib/test/performance');
    var Promise = require('bluebird');
    var samples = 1000;
    var a = new Array(samples), i = 0, defer = function() {
        var d = {};
        d.promise = new Promise(function(resolve, reject) {
            d.resolve = resolve;
            d.reject = reject;
        });
        return d;
    };
    var p = [];
    for(var it = 0; it < 50; ++it) {
        p.push(new Promise(function(fulfill) {
            fulfill(it);
        }));
    }
    var deferred = defer(), promise = deferred.promise;
    performance.measure(function(done) {
        var it = 0;
        var doThen = function() {
            return it < 50 ? p[it++].then(function(value) {
                return '' + value;
            }).then(doThen) : null;
        };
        promise = promise.then(doThen);
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