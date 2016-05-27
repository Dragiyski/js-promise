(function () {
    "use strict";
    function arrayMove(src, srcIndex, dst, dstIndex, len) {
        for (var j = 0; j < len; ++j) {
            dst[j + dstIndex] = src[j + srcIndex];
            src[j + srcIndex] = void 0;
        }
    }

    function findNextPowerOfTwo(n) {
        var prev;
        do {
            prev = n;
            n |= n >>> 1;
        } while (prev !== n);
        return ++prev;
    }

    function Queue(capacity) {
        this._capacity = capacity;
        this._back = 0;
        this._front = 0;
        this._length = 0;
    }

    Queue.prototype._ensureSizeOffset = function (size) {
        return this._capacity < size;
    };

    Queue.prototype.push = function () {
        var length = arguments.length;
        var requiredLength = this._length + length;
        this._ensureSize(requiredLength);
        this._length += length;
        for (var i = 0; i < length; ++i) {
            this[this._back] = arguments[i];
            this._back = (this._back + 1) & (this._capacity - 1);
        }
    };

    Queue.prototype.shift = function () {
        var front = this._front,
            ret = this[front];

        this[front] = undefined;
        this._front = (front + 1) & (this._capacity - 1);
        --this._length;
        return ret;
    };

    Queue.prototype.length = function () {
        return this._length;
    };

    Queue.prototype._ensureSize = function (size) {
        if (this._capacity < size) {
            this._resizeTo(findNextPowerOfTwo(size));
        }
    };

    Queue.prototype._resizeTo = function (capacity) {
        var oldCapacity = this._capacity;
        this._capacity = capacity;
        if (this._length > 0) {
            if (this._front >= this._back) {
                for (var i = 0, j = oldCapacity; i < this._back; ++i, j = (oldCapacity + i) & (capacity - 1)) {
                    this[j] = this[i];
                    this[i] = undefined;
                }
            }
            this._back = j;
        }
    };

    module.exports = Queue;
})();