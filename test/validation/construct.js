var assert = require('chai').assert;
var Promise = require('../..');

describe("When promise constructor is called", function () {
    context('as a function,', function () {
        specify('it should construct a promise.', function () {
            var p = Promise(function () {
            });
            assert.instanceOf(p, Promise);
        });
    });
    context('with invalid `resolver` argument,', function () {
        context('it should throw exception.', function () {
            specify('`resolver` is undefined', function () {
                assert.throws(function () {
                    new Promise(void 0)
                }, TypeError, 'Promise resolver undefined is not a function');
            });
            specify('`resolver` is null', function () {
                assert.throws(function () {
                    new Promise(null)
                }, TypeError, 'Promise resolver null is not a function');
            });
            specify('`resolver` is boolean/true', function () {
                assert.throws(function () {
                    new Promise(true)
                }, TypeError, 'Promise resolver true is not a function');
            });
            specify('`resolver` is boolean/false', function () {
                assert.throws(function () {
                    new Promise(false)
                }, TypeError, 'Promise resolver false is not a function');
            });
            specify('`resolver` is positive integer number', function () {
                assert.throws(function () {
                    new Promise(3)
                }, TypeError, 'Promise resolver 3 is not a function');
            });
            specify('`resolver` is negative integer number', function () {
                assert.throws(function () {
                    new Promise(-7)
                }, TypeError, 'Promise resolver -7 is not a function');
            });
            specify('`resolver` is floating-point number', function () {
                assert.throws(function () {
                    new Promise(0.25)
                }, TypeError, 'Promise resolver 0.25 is not a function');
            });
            specify('`resolver` is positive infinity', function () {
                assert.throws(function () {
                    new Promise(1 / 0)
                }, TypeError, 'Promise resolver Infinity is not a function');
            });
            specify('`resolver` is negative infinity', function () {
                assert.throws(function () {
                    new Promise(-1 / 0)
                }, TypeError, 'Promise resolver -Infinity is not a function');
            });
            specify('`resolver` is not-a-number', function () {
                assert.throws(function () {
                    new Promise(Number('x'))
                }, TypeError, 'Promise resolver NaN is not a function');
            });
            specify('`resolver` is string', function () {
                assert.throws(function () {
                    new Promise('not-a-resolver')
                }, TypeError, 'Promise resolver not-a-resolver is not a function');
            });
            specify('`resolver` is array', function () {
                assert.throws(function () {
                    new Promise([])
                }, TypeError, 'Promise resolver [object Array] is not a function');
            });
            specify('`resolver` is plain object', function () {
                assert.throws(function () {
                    new Promise({})
                }, TypeError, 'Promise resolver #<Object> is not a function');
            });
            specify('`resolver` is regular expression', function () {
                assert.throws(function () {
                    new Promise(/test/)
                }, TypeError, 'Promise resolver [object RegExp] is not a function');
            });
            specify('`resolver` is instance object of anonymous function', function () {
                assert.throws(function () {
                    new Promise(new (function () {
                    }))
                }, TypeError, 'Promise resolver [object Object] is not a function');
            });
            specify('`resolver` is instance object of named function', function () {
                assert.throws(function () {
                    new Promise(new (function Test() {
                    }))
                }, TypeError, 'Promise resolver #<Test> is not a function');
            });
            (function () {
                if (typeof Symbol !== 'function') {
                    return;
                }
                var s = Symbol();
                if (typeof s !== 'symbol') {
                    return;
                }
                specify('`resolver` is unnamed symbol', function () {
                    assert.throws(function () {
                        new Promise(Symbol())
                    }, TypeError, 'Promise resolver Symbol() is not a function');
                });
                specify('`resolver` is named symbol', function () {
                    assert.throws(function () {
                        new Promise(Symbol('test'))
                    }, TypeError, 'Promise resolver Symbol(test) is not a function');
                });
            })();
        });
    });
    context('with `resolver` that throws exception, make rejected promise', function() {
        specify('from pending promise', function(done) {
            var p, errorToThrow = {}, thrownError, isCalled = false;
            assert.doesNotThrow(function() {
                p = new Promise(function() {
                    throw errorToThrow;
                });
            });
            p.then(null, function(err) {
                thrownError = err;
                isCalled = true;
            });
            setTimeout(function() {
                assert(isCalled, 'Promise catch handler never called.');
                assert.strictEqual(thrownError, errorToThrow);
                done();
            }, 50);
        });
        specify('from already-fulfilled promise', function(done) {
            var p, errorToThrow = {}, thrownError, isCalled = false;
            assert.doesNotThrow(function() {
                p = new Promise(function(fulfill) {
                    fulfill('test');
                    throw errorToThrow;
                });
            });
            p.then(null, function(err) {
                thrownError = err;
                isCalled = true;
            });
            setTimeout(function() {
                assert(isCalled, 'Promise catch handler never called.');
                assert.strictEqual(thrownError, errorToThrow, 'Promise rejected with wrong reason.');
                done();
            }, 50);
        });
        specify('from already-rejected promise', function(done) {
            var p, errorToThrow = {}, wrongError = {}, thrownError, isCalled = false;
            assert.doesNotThrow(function() {
                p = new Promise(function(fulfill, reject) {
                    reject(wrongError);
                    throw errorToThrow;
                });
            });
            p.then(null, function(err) {
                thrownError = err;
                isCalled = true;
            });
            setTimeout(function() {
                assert(isCalled, 'Promise catch handler never called.');
                assert.strictEqual(thrownError, errorToThrow, 'Promise rejected with wrong reason.');
                done();
            }, 50);
        });
    });
});
