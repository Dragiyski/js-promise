(function () {
    "use strict";

    var symbolCheck = function () {
        return false;
        if (typeof Symbol !== 'function') {
            return false;
        }
        var s = Symbol();
        return typeof s === 'symbol';
    };

    var sc = {}, supportSymbols = symbolCheck();

    var makeSymbol = supportSymbols ? function (name) {
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


    var symbolList = {
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
        internalResolver: makeSymbol('internalResolver'),
        plugin: makeSymbol('plugin')
    };
    if(supportSymbols) {
        module.exports = symbolList;
    } else {
        var code = Object.keys(symbolList).map(function(key) {
            return JSON.stringify(key) + ':' + JSON.stringify(symbolList[key]);
        });
        code = code.join(',');
        code = 'return {' + code + '};';
        module.exports = (new Function(code))();
    }
})();