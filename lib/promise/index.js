(function () {
    "use strict";
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
        promise._hasValue = false;
        promise._hasResolvedValue = false;
        promise._isFulfilled = false;
        promise._value = null;
        promise._queue = null;
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
            if (promise._isFulfilled) {
                if (typeof onResolve === 'function') {
                    if (tryCatch(onResolve)(promise._value)) {
                        fulfillCallback(following, tryCatch.result);
                    } else {
                        reject(following, tryCatch.result);
                    }
                } else {
                    fulfillCallback(following, promise._value);
                }
            } else {
                if (typeof onReject === 'function') {
                    if (tryCatch(onReject)(promise._value)) {
                        fulfillCallback(following, tryCatch.result);
                    } else {
                        reject(following, tryCatch.result);
                    }
                } else {
                    reject(following, promise._value);
                }
            }
        });
        return following;
    };

    Promise._tryConvertToPromise = function (maybePromise) {
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
        if (promise._hasResolvedValue) {
            globalQueue.push(callback);
            processGlobalQueue();
        } else if (typeof promise._queue === 'function') {
            promise._queue = [promise._queue, callback];
        } else if (Array.isArray(promise._queue)) {
            promise._queue.push(callback);
        } else {
            promise._queue = callback;
        }
    };
    var processGlobalQueue = function Promise__processGlobalQueue() {
        if (globalQueueRunId == null) {
            globalQueueRunId = schedule(globalQueueTick);
        }
    };
    var promiseConsume = function Promise__consume(promise) {
        if (typeof promise._queue === 'function') {
            globalQueue.push(promise._queue);
        } else if (Array.isArray(promise._queue)) {
            Array.prototype.push.apply(globalQueue, promise._queue);
        } else {
            return;
        }
        promise._queue = null;
        processGlobalQueue();
    };
    var globalQueueTick = function Promise__globalQueueTick() {
        while (globalQueue.length > 0) {
            globalQueue.shift()();
        }
        globalQueueRunId = null;
    };
    var globalQueueRunId = null;
    var globalQueue = [];

    var doSettle = function Promise_doSettle(promise, fulfill, value) {
        promise._hasValue = true;
        promise._value = Promise._tryConvertToPromise(value);
        if (promise._value instanceof Promise) {
            if (!checkPromiseCycle(promise)) {
                promiseConsume(promise);
            } else {
                follow(promise);
            }
        } else {
            promise._hasResolvedValue = true;
            promise._isFulfilled = fulfill;
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
        var currentPromise = promise._value;
        do {
            if (currentPromise === promise) {
                promise._value = error.chainingCycleDetected(promise);
                promise._hasResolvedValue = true;
                promise._isFulfilled = false;
                return false;
            }
        } while (nextInChain());
        function nextInChain() {
            if (currentPromise._hasValue && currentPromise._value instanceof Promise) {
                currentPromise = currentPromise._value;
                return true;
            }
            return false;
        }

        return true;
    };

    var follow = function Promise__follow(promise) {
        var leader = promise._value;
        when(leader, function Promise_follow_continue() {
            promise._hasResolvedValue = true;
            promise._isFulfilled = leader._isFulfilled;
            promise._value = leader._value;
            promiseConsume(promise);
        });
    };

    var fulfillCallback = function Promise_fulfillWithSettle(promise, value) {
        if (!promise._hasValue) {
            doSettle(promise, true, value);
        }
    };

    var rejectCallback = function Promise_rejectWithSettle(promise, value) {
        if (!promise._hasValue) {
            doSettle(promise, false, value);
        }
    };

    var reject = function Promise_rejectDirectly(promise, reason) {
        if (!promise._hasValue) {
            promise._hasValue = promise._hasResolvedValue = true;
            promise._isFulfilled = false;
            promise._value = reason;
            promiseConsume(promise);
        }
    };

    var rejectDirectly = function Promise_rejectDirectly(promise, reason) {
        promise._hasValue = promise._hasResolvedValue = true;
        promise._isFulfilled = false;
        promise._value = reason;
        promiseConsume(promise);
    };

    module.exports = Promise;
})();