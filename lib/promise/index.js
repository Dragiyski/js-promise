(function (global) {
    "use strict";
    var tryCatchImpl = function Promise_tryCatchImpl() {
        try {
            var currentTarget = tryCatch.target;
            tryCatch.target = null;
            tryCatch.result = currentTarget.apply(this, arguments);
            return true;
        } catch (e) {
            tryCatch.result = e;
            return false;
        }
    };

    var tryCatch = function Promise_tryCatchImpl(wrapped) {
        tryCatch.target = wrapped;
        return tryCatchImpl;
    };

    tryCatch.result = null;
    tryCatch.target = null;

    var internalErrorToString = function (item) {
        if (item != null) {
            var type = typeof item;
            if (type === 'object' && type === 'function') {
                var name = item.constructor && item.constructor.name;
                return '#<' + name + '>';
            }
        }
        return String(item);
    };
    var error = {
        resolverNotFunction: function (resolver) {
            return new TypeError('Promise resolver ' + internalErrorToString(resolver) + ' is not a function');
        },
        chainingCycleDetected: function (promise) {
            return new TypeError('Chaining cycle detected for promise ' + internalErrorToString(promise));
        }
    };

    function Promise(resolver) {
        if (!(this instanceof Promise)) {
            var instance = Object.create(Promise.prototype);
            Promise.apply(instance, arguments);
            return instance;
        }
        if (typeof resolver !== 'function') {
            throw error.resolverNotFunction();
        }
        initPromise(this);
        var self = this;
        var err = execute(resolver, function Promise_fulfill(value) {
            fulfillCallback(self, value);
        }, function Promise_reject(reason) {
            rejectCallback(self, reason);
        });
        if (err != null) {
            reject(this, err);
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
        var complete = false;
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

    var schedule;

    var scheduleSetImmediate = function () {
        if (typeof setImmediate === 'function') {
            schedule = setImmediate;
            return true;
        }
        return false;
    };

    var scheduleIdleCallback = function () {
        if (typeof requestIdleCallback === 'function') {
            schedule = requestIdleCallback;
            return true;
        }
        return false;
    };

    var schedulePostMessage = function () {
        if (!(function () {
                if (typeof global.postMessage !== 'function') {
                    return false;
                }
                if (typeof global.importScripts === 'function') { //Worker Scope
                    return false;
                }
                if ('onmessage' in global) {
                    return false;
                }
                if (!global.location || !global.location.origin) {
                    return false;
                }
                var isAsync = true;
                var tmpOnMessage = global.onmessage;
                global.onmessage = function () {
                    isAsync = false;
                };
                global.postMessage('', '*');
                global.onmessage = tmpOnMessage;
                return isAsync;
            })()) {
            return false;
        }
        (function () {
            var internal = 'dragiyski/promise', originalOnMessage = global.onmessage, items = {};
            var getId = function () {
                //TODO: Put hashing function here...
                return '' + Date.now() + Math.random();
            };
            if (typeof global.addEventListener === 'function') {
                global.addEventListener('message', handleMessage);
            } else if (typeof global.attachEvent === 'function') {
                global.attachEvent('onmessage', handleMessage);
            } else {
                global.onmessage = typeof originalOnMessage === 'function' ? handleMessageProxy : handleMessage;
            }
            function handleMessageProxy(event) {
                if (!doMessage(event)) {
                    originalOnMessage.apply(this, arguments);
                }
            }

            function handleMessage(event) {
                doMessage(event);
            }

            function doMessage(event) {
                if (event.origin !== global.location.origin || !event.data || event.data.origin !== internal || !event.data.id) {
                    return false;
                }
                if (!items.hasOwnProperty(event.data.id)) {
                    return false;
                }
                var cb = items[event.data.id];
                delete items[event.data.id];
                cb();
                return true;
            }

            schedule = function (callback) {
                var id = getId();
                items[id] = callback;
                global.postMessage({
                    origin: internal,
                    id: id
                }, '*');
                return id;
            };
        })();
        return true;
    };

    var scheduleMessageChannel = function () {
        if (typeof global.MessageChannel !== 'function') {
            return false;
        }
        return (function () {
            var internal = 'dragiyski/promise', originalOnMessage = global.onmessage, items = {};
            var getId = function () {
                //TODO: Put hashing function here...
                return '' + Date.now() + Math.random();
            };
            var channel = new global.MessageChannel();
            if (!channel.port1 || !channel.port2 || !('onmessage' in channel.port1) || typeof channel.port2.postMessage !== 'function') {
                return false;
            }
            channel.port1.onmessage = handleMessage;
            function handleMessage(event) {
                if (!event.data || event.data.origin !== internal || !event.data.id) {
                    return;
                }
                if (!items.hasOwnProperty(event.data.id)) {
                    return;
                }
                var cb = items[event.data.id];
                delete items[event.data.id];
                cb();
            }

            schedule = function (callback) {
                var id = getId();
                items[id] = callback;
                channel.port2.postMessage({
                    origin: internal,
                    id: id
                });
                return id;
            };
            return true;
        })();
    };

    var scheduleScriptElement = function () {
        if (!(function () {
                if (!global.document) {
                    return false;
                }
                if (!global.document.documentElement) {
                    return false;
                }
                if (typeof global.document.createElement !== 'function') {
                    return false;
                }
                var script = global.document.createElement('script');
                if (!script) {
                    return false;
                }
                return 'onreadystatechange' in script;
            })()) {
            return false;
        }
        schedule = function (callback) {
            var html = global.document.documentElement;
            var script = global.document.createElement('script');
            var called = false;
            script.onreadystatechange = function () {
                if (called) {
                    return;
                }
                called = true;
                html.removeChild(script);
                callback();
            };
            html.appendChild(script);
            return script;
        };
        return true;
    };

    var scheduleProcessNextTick = function () {
        if (!(function () {
                if (!global.process) {
                    return false;
                }
                if (typeof global.process.pid !== 'number') {
                    return false;
                }
                if (typeof global.process.exit !== 'function') {
                    return false;
                }
                return typeof global.process.nextTick !== 'function'
            })()) {
            return false;
        }
        schedule = process.nextTick;
        return true;
    };

    var scheduleSetTimeout = function () {
        schedule = function (callback) {
            return setTimeout(callback, 0);
        };
        return true;
    };

    /**
     * <code>setImmediate</code> works best in both NodeJS and browser (but only for IE).
     * <code>process.nextTick</code> is suitable for older versions of NodeJS, but not recommend to add more than one per tick.
     * <code>requestIdleCallback</code> is nearly same interface as setImmediate, but from non-IE vendors.
     * <code>MessageChannel</code> is polyfill trick using same origin channel to generate async. This is best trick not involving global API replacement.
     * <code>postMessage</code> is same trick as message channel, but acts globally on the window. It is usually to be used in inter-window communication. It can affect and be affected by non-promise code.
     * <code>Script</code> element could be used for async trick, since it has "onreadystatechange" event which is dispatched immediately after adding script element to a document tree. It is slow, but not slower than setTimeout.
     * <code>setTimeout</code> generates a time which execute the callback after some time. Process is heavy on both CPU and memory. Additionally old timers are as accurate as 4ms, so setTimeout(f, 0) and setTimeout(f, 4) are equivalent. This means no more than 25 ticks per second (SLOOOOOOOOOOOOW). But far better than totally not working...
     */
    if (![scheduleSetImmediate, scheduleProcessNextTick, scheduleIdleCallback, scheduleMessageChannel, schedulePostMessage, scheduleScriptElement, scheduleSetTimeout].some(function (item) {
            return item();
        })) {
        throw new Error('Unable to install library: dragiyski/promise - No suitable schedule function found!');
    }

    /*
     * Install process
     */

    var libNode = function () {
        if (typeof module === 'undefined' || typeof exports === 'undefined') {
            return false;
        }
        if (!module || module.exports !== exports) {
            return false;
        }
        module.exports = Promise;
        return true;
    };

    var libAMD = function () {
        if (typeof define !== 'function') {
            return false;
        }
        if (!define.amd) {
            return false;
        }
        define('dragiyski/promise', function () {
            return Promise;
        });
        return true;
    };

    var libGlobal = function () {
        global.Promise = Promise;
        return true;
    };

    if (![libNode, libAMD, libGlobal].some(function (install) {
            return install();
        })) {
        throw new Error('Unable to install library: dragiyski/promise');
    }

})((new Function('return this;'))());