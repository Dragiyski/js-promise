(function() {
    "use strict";
    var performance = require('../../../../../../lib/test/performance');
    var Promise = require('../../../../../..');
    var samples = 1000;
    var a = new Array(samples), i = 0;
    performance.measure(function(done) {
        a[i++] = new Promise(function(fulfill, reject) {
            fulfill(null);
        });
        done(null);
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