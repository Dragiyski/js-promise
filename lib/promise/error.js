(function() {
    "use strict";
    var internalErrorToString = function (item) {
        if (item != null) {
            var type = typeof item;
            if (type === 'object' || type === 'function') {
                if(item.toString === Object.prototype.toString) {
                    var name = item.constructor && item.constructor.name;
                    if(typeof name === 'string' && name.length > 0) {
                        return '#<' + name + '>';
                    }
                }
                return Object.prototype.toString.call(item);
            } else if(type === 'symbol') { // In earlier versions of V8, String(symbol) throws exception.
                return item.toString();
            }
        }
        return String(item);
    };
    module.exports = {
        resolverNotFunction: function (resolver) {
            return new TypeError('Promise resolver ' + internalErrorToString(resolver) + ' is not a function');
        },
        chainingCycleDetected: function (promise) {
            return new TypeError('Chaining cycle detected for promise ' + internalErrorToString(promise));
        }
    };
})();