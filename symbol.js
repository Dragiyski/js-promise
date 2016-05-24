(function () {
    "use strict";

    var symbolCheck = function () {
        if (typeof Symbol !== 'function') {
            return false;
        }
        var s = Symbol();
        return typeof s === 'symbol';
    };

    var sc = {};

    var makeSymbol = symbolCheck() ? function (name) {
        return Symbol(name);
    } : function (name) {
        var s = 'dragiyski/promise:' + name;
        if(sc.hasOwnProperty(s)) {
            s += ++sc[s];
        } else {
            s += sc[s] = 0;
        }
        return s;
    };

    module.exports = {
        hasValue: makeSymbol('hasValue'),
        hasResolvedValue: makeSymbol('hasResolvedValue'),
        isFulfilled: makeSymbol('isFulfilled'),
        value: makeSymbol('value'),
        queue: makeSymbol('queue'),
        tryConvertToPromise: makeSymbol('tryConvertToPromise'),
        tryConvertToValue: makeSymbol('tryConvertToValue'),
        onEnterQueue: makeSymbol('onEnterQueue'),
        onLeaveQueue: makeSymbol('onLeaveQueue'),
        onFulfill: makeSymbol('onFulfill'),
        onReject: makeSymbol('onReject'),
        plugin: makeSymbol('plugin')
    };
})();