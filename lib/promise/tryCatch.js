(function() {
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

    var tryCatch = module.exports = function Promise_tryCatchImpl(wrapped) {
        tryCatch.target = wrapped;
        return tryCatchImpl;
    };

    tryCatch.result = null;
    tryCatch.target = null;
})();