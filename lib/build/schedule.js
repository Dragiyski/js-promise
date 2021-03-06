(function(global) {
    "use strict";

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
                //TODO: Put better hashing function here...
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
            var internal = 'dragiyski/promise', items = {};
            var getId = function () {
                //TODO: Put better hashing function here...
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

    module.exports = schedule;
})((new Function('return this;'))());