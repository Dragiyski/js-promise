(function() {
    "use strict";
    var performance = require('../../../../lib/test/performance');
    var samples = 1000;
    var a = new Array(samples), i = 0, f = function() {};
    var result = performance.measure.sync(function() {
        a[i++] = typeof f === 'function';
    }, {
        samples: samples
    });
    performance.measure.showResult(result);
    process.exit(0);
})();