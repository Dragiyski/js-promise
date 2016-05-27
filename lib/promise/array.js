(function() {
    "use strict";
    var findNextPowerOfTwo = function(n) {
        var prev;
        do {
            prev = n;
            n |= n >>> 1;
        } while(prev !== n);
        return ++prev;
    };
    exports.processArray = function(array) {
        if(array._length == null) {
            array._length = array.length;
            array._begin = 0;
            array.length = findNextPowerOfTwo(array._length);
        }
        return array;
    };
    exports.pushArray = function(array, items) {
        if(array._length + items._length > array.length) {
            array.length = findNextPowerOfTwo(array._length + items._length);
        }
        arrayCopy(items, 0, array, array._length, items._length);
        return array._length += items._length;
    };
    exports.pushOne = function(array, item) {
        if(array._length + 1 > array.length) {
            array.length = array.length << 1;
        }
        array[array._length++] = item;
        return array._length;
    };
    exports.shiftOne = function(array) {
        if(array._begin > (array.length >>> 1)) {
            array.splice(0, array._begin);
            array._begin = 0;
        }
        return array[array._begin++];
    };
    var arrayCopy = exports.arrayCopy = function(src, srcIndex, dst, dstIndex, length) {
        for(var i = 0; i < length; ++i) {
            dst[dstIndex + i] = src[srcIndex + i];
        }
        return dst;
    };
})();