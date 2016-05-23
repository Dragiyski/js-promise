var NOT_FOUND = {};
var REGEX_EXT = /\.js$/;

function createRequire(__dirname, __filename) {
    return function (module) {
        var modulePath = module.split('/');
        modulePath = __dirname.split('/').concat(modulePath);
        var normalizedPath = [];
        modulePath.forEach(function(modulePathDir) {
            if(modulePathDir === '..') {
                normalizedPath.pop();
            } else if(modulePathDir !== '.') {
                normalizedPath.push(modulePathDir);
            }
        });
        modulePath = normalizedPath.join('/');
        var result = NOT_FOUND;
        if(![tryDirectPath, tryExtensionJSPath, tryDirectoryPath].some(function(pathMapper) {
                result = pathMapper(modulePath);
                return result !== NOT_FOUND;
            })) {
            throw new TypeError('Unable to find module: ' + modulePath);
        }
        return result;
    }
}

function tryDirectPath(realPath) {
    if(!requireCache.hasOwnProperty(realPath)) {
        return NOT_FOUND;
    }
    return requireCache[realPath]();
}

function tryExtensionJSPath(realPath) {
    realPath += '.js';
    if(!requireCache.hasOwnProperty(realPath)) {
        return NOT_FOUND;
    }
    return requireCache[realPath]();
}

function tryDirectoryPath(realPath) {
    realPath += '/index.js';
    if(!requireCache.hasOwnProperty(realPath)) {
        return NOT_FOUND;
    }
    return requireCache[realPath]();
}