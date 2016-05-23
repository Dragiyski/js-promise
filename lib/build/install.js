(function(global) {
    "use strict";
    var Promise = require('../promise');

    var installForNodeJS = function () {
        if (typeof module === 'undefined' || typeof exports === 'undefined') {
            return false;
        }
        if (!module || module.exports !== exports) {
            return false;
        }
        module.exports = Promise;
        return true;
    };

    var installWithAMD = function () {
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

    var installGlobally = function () {
        global.Promise = Promise;
        return true;
    };

    if (![installForNodeJS, installWithAMD, installGlobally].some(function (install) {
            return install();
        })) {
        throw new Error('Unable to install library: dragiyski/promise');
    }
})((new Function('return this;'))());