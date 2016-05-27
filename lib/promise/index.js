(function () {
    "use strict";
    var Queue = require('./queue');
    var symbol = require('../../symbol');
    var error = require('./error');
    var schedule = require('../build/schedule');
    var tryCatch = require('./tryCatch');

    function Promise(resolver) {
        if (!(this instanceof Promise)) {
            var instance = Object.create(Promise.prototype);
            Promise.apply(instance, arguments);
            return instance;
        }
        if (typeof resolver !== 'function') {
            throw error.resolverNotFunction(resolver);
        }
        initPromise(this);
        var self = this;
        var err = execute(resolver, function Promise_fulfill(value) {
            fulfillCallback(self, value);
        }, function Promise_reject(reason) {
            rejectCallback(self, reason);
        });
        if (err != null) {
            rejectDirectly(this, err);
        }
    }

    var initPromise = function (promise) {
        promise[symbol.hasValue] = false;
        promise[symbol.hasResolvedValue] = false;
        promise[symbol.isFulfilled] = false;
        promise[symbol.value] = null;
        promise[symbol.queue] = null;
    };

    var createPending = function Promise__createPending() {
        var promise = Object.create(Promise.prototype);
        initPromise(promise);
        return promise;
    };

    Promise.prototype.then = function (onResolve, onReject) {
        var promise = this;
        var following = createPending();
        when(this, function Promise_then_continue() {
            if (promise[symbol.isFulfilled]) {
                if (typeof onResolve === 'function') {
                    if (tryCatch(onResolve)(promise[symbol.value])) {
                        fulfillCallback(following, tryCatch.result);
                    } else {
                        reject(following, tryCatch.result);
                    }
                } else {
                    fulfillCallback(following, promise[symbol.value]);
                }
            } else {
                if (typeof onReject === 'function') {
                    if (tryCatch(onReject)(promise[symbol.value])) {
                        fulfillCallback(following, tryCatch.result);
                    } else {
                        reject(following, tryCatch.result);
                    }
                } else {
                    reject(following, promise[symbol.value]);
                }
            }
        });
        return following;
    };

    Promise[symbol.tryConvertToPromise] = function (maybePromise) {
        if (maybePromise !== null && !(maybePromise instanceof Promise) && (typeof maybePromise === 'object' || typeof maybePromise === 'function')) {
            if (tryCatch(getThen)(maybePromise)) {
                var then = tryCatch.result;
                if (typeof then === 'function') {
                    var adopted = createPending();
                    if (!tryCatch(then).call(maybePromise, function (value) {
                            fulfillCallback(adopted, value);
                        }, function (reason) {
                            reject(adopted, reason);
                        })) {
                        reject(adopted, tryCatch.result);
                    }
                    return adopted;
                }
            } else {
                return new Promise(function (fulfill, reject) {
                    reject(tryCatch.result);
                })
            }
        }
        return maybePromise;
    };

    var getThen = function Promise_getThen(maybePromise) {
        return maybePromise.then;
    };

    var when = function Promise_when(promise, callback) {
        if (promise[symbol.hasResolvedValue]) {
            globalQueue.push(callback);
            processGlobalQueue();
        } else if (typeof promise[symbol.queue] === 'function') {
            var first = promise[symbol.queue];
            promise[symbol.queue] = new Queue(4);
            promise[symbol.queue].push(first, callback);
        } else if (promise[symbol.queue] instanceof Queue) {
            promise[symbol.queue].push(callback);
        } else {
            promise[symbol.queue] = callback;
        }
    };
    var processGlobalQueue = function Promise__processGlobalQueue() {
        if (globalQueueRunId == null) {
            globalQueueRunId = schedule(globalQueueTick);
        }
    };
    var promiseConsume = function Promise__consume(promise) {
        if (typeof promise[symbol.queue] === 'function') {
            globalQueue.push(promise[symbol.queue]);
        } else if (promise[symbol.queue] instanceof Queue) {
            Queue.prototype.push.apply(globalQueue, promise[symbol.queue].shiftAll());
        } else {
            return;
        }
        promise[symbol.queue] = null;
        processGlobalQueue();
    };
    var globalQueueTick = function Promise__globalQueueTick() {
        while (globalQueue.length() > 0) {
            globalQueue.shift()();
        }
        globalQueueRunId = null;
    };
    var globalQueueRunId = null;
    var globalQueue = new Queue(16);

    var doSettle = function Promise_doSettle(promise, fulfill, value) {
        promise[symbol.hasValue] = true;
        promise[symbol.value] = Promise[symbol.tryConvertToPromise](value);
        if (promise[symbol.value] instanceof Promise) {
            if (!checkPromiseCycle(promise)) {
                promiseConsume(promise);
            } else {
                follow(promise);
            }
        } else {
            promise[symbol.hasResolvedValue] = true;
            promise[symbol.isFulfilled] = fulfill;
            promiseConsume(promise);
        }
    };

    var execute = function Promise__globalQueueExecute(executor, resolve, reject) {
        try {
            executor(resolve, reject);
        } catch (e) {
            return e;
        }
    };

    var checkPromiseCycle = function Promise__checkPromiseCycle(promise) {
        var currentPromise = promise[symbol.value];
        do {
            if (currentPromise === promise) {
                promise[symbol.value] = error.chainingCycleDetected(promise);
                promise[symbol.hasResolvedValue] = true;
                promise[symbol.isFulfilled] = false;
                return false;
            }
        } while (nextInChain());
        function nextInChain() {
            if (currentPromise[symbol.hasValue] && currentPromise[symbol.value] instanceof Promise) {
                currentPromise = currentPromise[symbol.value];
                return true;
            }
            return false;
        }

        return true;
    };

    var follow = function Promise__follow(promise) {
        var leader = promise[symbol.value];
        when(leader, function Promise_follow_continue() {
            promise[symbol.hasResolvedValue] = true;
            promise[symbol.isFulfilled] = leader[symbol.isFulfilled];
            promise[symbol.value] = leader[symbol.value];
            promiseConsume(promise);
        });
    };

    var fulfillCallback = function Promise_fulfillWithSettle(promise, value) {
        if (!promise[symbol.hasValue]) {
            doSettle(promise, true, value);
        }
    };

    var rejectCallback = function Promise_rejectWithSettle(promise, value) {
        if (!promise[symbol.hasValue]) {
            doSettle(promise, false, value);
        }
    };

    var reject = function Promise_rejectDirectly(promise, reason) {
        if (!promise[symbol.hasValue]) {
            promise[symbol.hasValue] = promise[symbol.hasResolvedValue] = true;
            promise[symbol.isFulfilled] = false;
            promise[symbol.value] = reason;
            promiseConsume(promise);
        }
    };

    var rejectDirectly = function Promise_rejectDirectly(promise, reason) {
        promise[symbol.hasValue] = promise[symbol.hasResolvedValue] = true;
        promise[symbol.isFulfilled] = false;
        promise[symbol.value] = reason;
        promiseConsume(promise);
    };

    module.exports = Promise;
})();