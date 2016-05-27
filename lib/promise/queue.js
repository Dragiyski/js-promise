(function () {
    "use strict";

    function findNextPowerOfTwo(n) {
        if ((n & -n) === n) return n;
        var prev;
        do {
            prev = n;
            n |= n >>> 1;
        } while (prev !== n);
        return ++prev;
    }

    function Queue(capacity) {
        this._capacity = capacity;
        this._front = this._back = this._length = 0;
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
        if(this._length <= 0) {
            return;
        }
        var front = this._front,
            ret = this[front];

        this[front] = undefined;
        this._front = (front + 1) & (this._capacity - 1);
        --this._length;
        return ret;
    };

    Queue.prototype.shiftAll = function() {
        var a = new Array(this._length), i, j;
        if(this._front >= this._back) {
            for(i = this._front, j = 0; i < this._capacity; ++i) {
                a[j++] = this[i];
            }
            for(i = 0; i < this._back; ++i) {
                a[j++] = this[i];
            }
        } else {
            for(i = this._front, j = 0; i < this._back; ++i) {
                a[j++] = this[i];
            }
        }
        this._front = this._back = this._length = 0;
        return a;
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