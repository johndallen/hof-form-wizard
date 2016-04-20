'use strict';

module.exports = function(options) {
    var translate = options.settings.translate;
    return function (req, res, next) {
        if (translate) {
            req.translate = translate;
        }
        next();
    };
};
