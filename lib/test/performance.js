(function () {
    var async = require('async');
    var measure = exports.measure = function (callback, options, done) {
        options = handleOptions.measure(options);
        var mean, stdv, rldv;
        createSamples(callback, options.samples, function (err, samples) {
            if (err) {
                return done(err);
            }
            //console.dir(samples);
            mean = calcMean(samples);
            stdv = calcStandardDeviation(samples, mean);
            rldv = stdv / mean;
            async.whilst(function () {
                return rldv > options.deviation;
            }, function (doneIteration) {
                createSamples(callback, options.samples, function (err, newSamples) {
                    if (err) {
                        return doneIteration(err);
                    }
                    //console.dir(newSamples);
                    setImmediate(function () {
                        samples = samples.concat(newSamples);
                        samples.sort(numeric);
                        mean = calcMean(samples);
                        async.whilst(function () {
                            return samples.length > options.samples;
                        }, function (doneIteration) {
                            setImmediate(function () {
                                if ((samples[samples.length - 1] - mean) >= (samples[0] - mean)) {
                                    samples.pop();
                                } else {
                                    samples.shift();
                                }
                                doneIteration(null);
                            });
                        }, function (err) {
                            if (err) {
                                return doneIteration(err);
                            }
                            mean = calcMean(samples);
                            stdv = calcStandardDeviation(samples, mean);
                            rldv = stdv / mean;
                            doneIteration(null);
                        });
                    });
                });
            }, function (err) {
                if (err) {
                    return done(err);
                }
                done(null, {
                    mean: mean,
                    standardDeviation: stdv,
                    relativeDeviation: rldv
                });
            });
            //done(null, result);
        });
    };
    measure.sync = function (callback, options) {
        options = handleOptions.measure(options);
        var samples = createSamples.sync(callback, options.samples);
        //console.dir(samples);
        var mean, stdv, rldv, newSamples;
        mean = calcMean(samples);
        stdv = calcStandardDeviation(samples, mean);
        rldv = stdv / mean;
        while (rldv > options.deviation) {
            newSamples = createSamples.sync(callback, options.samples);
            //console.dir(newSamples);
            samples = samples.concat(newSamples);
            samples.sort(numeric);
            mean = calcMean(samples);
            while (samples.length > options.samples) {
                if ((samples[samples.length - 1] - mean) >= (samples[0] - mean)) {
                    samples.pop();
                } else {
                    samples.shift();
                }
            }
            mean = calcMean(samples);
            stdv = calcStandardDeviation(samples, mean);
            rldv = stdv / mean;
        }
        return {
            mean: mean,
            standardDeviation: stdv,
            relativeDeviation: rldv
        };
    };
    measure.showResult = function (result) {
        var names = ['mean', 'stdv', 'rldv'];
        var items = [result.mean, result.standardDeviation, result.relativeDeviation];
        var stringifier = [numberFloatingPoint(2), numberFloatingPoint(2), numberPercentage(2)];
        var dots = [];
        var strings = [];
        items.forEach(function (item, index) {
            strings[index] = stringifier[index](item);
            dots[index] = strings[index].indexOf('.');
            if (dots[index] < 0) {
                dots[index] = strings[index].length;
            }
        });
        var offset = Math.max.apply(Math, dots);
        strings = strings.map(function (item, index) {
            return fill(item, offset - dots[index], ' ');
        });
        strings.forEach(function (item, index) {
            console.log(names[index] + ': ' + item);
        });
    };
    var fill = function (s, c, ch) {
        for (var i = 0; i < c; ++i) {
            s = ch + s;
        }
        return s;
    };
    var numberFloatingPoint = function (precision) {
        return function (n) {
            return n.toFixed(precision);
        };
    };
    var numberPercentage = function (precision) {
        var toNumber = numberFloatingPoint(precision);
        return function (n) {
            n = toNumber(n * 100);
            n += ' %';
            return n;
        };
    };
    measure.defaults = {
        samples: 100,
        deviation: 5
    };
    var createSamples = function (callback, count, done) {
        var iteration = 0, samples = new Array(count);
        async.whilst(function () {
            return iteration < count;
        }, function (done) {
            setImmediate(function () {
                var time = process.hrtime();
                callback(function () {
                    time = process.hrtime(time);
                    time = time[0] * 1e9 + time[1];
                    samples[iteration++] = time;
                    done(null);
                });
            });
        }, function (err) {
            if (err) {
                return done(err);
            }
            done(null, samples);
        });
    };
    createSamples.sync = function (callback, count) {
        var iteration = 0, samples = new Array(count), time;
        while (iteration < count) {
            time = process.hrtime();
            callback();
            time = process.hrtime(time);
            time = time[0] * 1e9 + time[1];
            samples[iteration++] = time;
        }
        return samples;
    };
    var handleOptions = {};
    handleOptions.measure = function (options) {
        options = options || {};
        var result = {};
        Object.keys(measure.defaults).forEach(function (key) {
            if (!options.hasOwnProperty(key)) {
                result[key] = measure.defaults[key];
            } else {
                result[key] = options[key];
            }
        });
        if (typeof result.samples !== 'number' || !isFinite(result.samples) || result.samples <= 0 || parseInt(result.samples) !== result.samples) {
            throw new TypeError('Expected [samples] to be positive integer.')
        }
        if (typeof result.deviation !== 'number' || !isFinite(result.deviation) || result.deviation < 0 || result.deviation > 100) {
            throw new TypeError('Expected [samples] to be positive number in range [0; 100].');
        }
        result.deviation /= 100;
        return result;
    };
    var calcMean = function (data) {
        return data.reduce(function (sum, item) {
                return sum + item;
            }, 0) / data.length;
    };
    var calcVariance = function (data, meanValue) {
        if (meanValue == null) {
            meanValue = mean(data);
        }
        return data.reduce(function (sum, item) {
            return sum + ((item - meanValue) * (item - meanValue)) / data.length;
        }, 0);
    };
    var calcStandardDeviation = function (data, meanValue) {
        return Math.sqrt(calcVariance(data, meanValue));
    };
    var numeric = function (a, b) {
        return a - b;
    }
})();