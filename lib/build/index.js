(function () {
    "use strict";

    var path = require('path');
    var fs = require('fs');
    var vm = require('vm');

    var BASE_DIR = path.resolve(__dirname, '../..');

    (function() {
        try {
            fs.mkdirSync(path.resolve(BASE_DIR, 'dist'), parseInt('0755', 8));
        } catch(e) {
            if(e.code === 'EEXIST') {
                return;
            }
            throw e;
        }
    })();

    var main;
    var files = [
        path.relative(BASE_DIR, path.resolve(__dirname, '../promise/error.js')),
        path.relative(BASE_DIR, path.resolve(__dirname, './schedule.js')),
        path.relative(BASE_DIR, path.resolve(__dirname, '../promise/tryCatch.js')),
        path.relative(BASE_DIR, path.resolve(__dirname, '../promise/index.js')),
        main = path.relative(BASE_DIR, path.resolve(__dirname, './install.js'))
    ];

    var mkModuleSource = function(file, source) {
        return 'requireCache[\'' + file + '\'] = (function() {\n' +
            'var __dirname = \'' + path.dirname(file) + '\';\n' +
            'var __filename = \'' + file + '\';\n' +
            'var require = createRequire(__dirname, __filename);\n' +
            'var module = {};\n' +
            'var exports = module.exports = {};' +
            source + '\n' +
            'requireCache[\'' + file + '\'] = function(){return module.exports;};\n' +
            'return module.exports;\n' +
            '});\n';
    };
    var mkMainSource = function(file, source) {
        return 'requireCache[\'' + file + '\'] = (function() {\n' +
        'var __dirname = \'' + path.dirname(file) + '\';\n' +
        'var __filename = \'' + file + '\';\n' +
        'var require = createRequire(__dirname, __filename);\n' +
        'var result = ' + source + '\n' +
        'requireCache[\'' + file + '\'] = function(){return result;};\n' +
        'return result;\n' +
        '});\n';
    };
    var sources = files.map(function (file) {
        var location = path.resolve(BASE_DIR, file);
        var source = fs.readFileSync(location, {encoding: 'utf8'});
        return (file === main ? mkMainSource : mkModuleSource)(file, source);
    });
    var prefix = fs.readFileSync(path.resolve(__dirname, './prefix.js'), {encoding: 'utf8'});
    var suffix = fs.readFileSync(path.resolve(__dirname, './suffix.js'), {encoding: 'utf8'});
    var requireMain = 'requireCache[\'' + main + '\']();';
    var code = '(function() {\n' + prefix + '\n' + sources.join('\n') + '\n' + suffix + '\n' + requireMain + '\n' + '})();';

    fs.writeFileSync(path.resolve(BASE_DIR, 'dist/browser.js'), code, {encoding: 'utf8'})
})();