var Queue = require('../../lib/promise/queue');
var assert = require('chai').assert;

function executeOperationSeries(queue, operations) {
    var result = [];
    operations.forEach(function (op) {
        switch (op.type) {
            case 'push':
                op.items.forEach(function (item) {
                    queue.push(item);
                });
                break;
            case 'shift':
                (function () {
                    for (var i = 0, j = op.count; i < j; ++i) {
                        result.push(queue.shift());
                    }
                })();
                break;
            case 'shiftAll':
                result = result.concat(shiftAll(queue));
                break;
        }
    });
    return result;
}

function shiftAll(queue) {
    if(queue instanceof Queue) {
        return queue.shiftAll();
    }
    return queue;
}

function compareItems(queue, operations, results) {
    var insideList = [], outsideList = executeOperationSeries(insideList, operations);
    var insideIndex = 0, outsideIndex = 0;
    while (queue.length() > 0) {
        assert.isBelow(insideIndex, insideList.length);
        assert.strictEqual(queue.shift(), insideList[insideIndex++]);
    }
    while (results.length > 0) {
        assert.isBelow(outsideIndex, outsideList.length);
        assert.strictEqual(results.shift(), outsideList[outsideIndex++]);
    }
}

describe('Queue construct', function () {
    specify('without throwing exception', function () {
        assert.doesNotThrow(function () {
            var q = new Queue(4);
            assert.instanceOf(q, Queue);
        });
    });
});
describe('Queue must retains first-in first-out order of elements,', function () {
    specify('when push', function () {
        var queue = new Queue(1);
        var operations = [
            {
                type: 'push',
                items: [{test:1}, {test:2}, {test:3}, {test:4}, {test:5}, {test:6}, {test:7}, {test:8}, {test:9}]
            }
        ];
        var shiftedOut = executeOperationSeries(queue, operations);
        compareItems(queue, operations, shiftedOut);
    });
    specify('when push, then shift, then push', function () {
        var queue = new Queue(1);
        var operations = [
            {
                type: 'push',
                items: [{test:1}, {test:2}, {test:3}, {test:4}, {test:5}]
            },
            {
                type: 'shift',
                count: 3
            },
            {
                type: 'push',
                items: [{test:6}, {test:7}, {test:8}, {test:9}, {test:10}, {test:11}]
            }
        ];
        var shiftedOut = executeOperationSeries(queue, operations);
        compareItems(queue, operations, shiftedOut);
    });
    specify('when grows, then shiftAll', function () {
        var queue = new Queue(1);
        var operations = [
            {
                type: 'push',
                items: [{test:1}, {test:2}, {test:3}, {test:4}, {test:5}, {test:6}, {test:7}, {test:8}, {test:9}]
            },
            {
                type: 'shiftAll'
            }
        ];
        var shiftedOut = executeOperationSeries(queue, operations);
        compareItems(queue, operations, shiftedOut);
    });
    specify('when push, then shift, then push, then shiftAll', function () {
        var queue = new Queue(1);
        var operations = [
            {
                type: 'push',
                items: [{test:1}, {test:2}, {test:3}, {test:4}, {test:5}]
            },
            {
                type: 'shift',
                count: 3
            },
            {
                type: 'push',
                items: [{test:6}, {test:7}, {test:8}, {test:9}, {test:10}, {test:11}]
            },
            {
                type: 'shiftAll'
            }
        ];
        var shiftedOut = executeOperationSeries(queue, operations);
        compareItems(queue, operations, shiftedOut);
    });
});