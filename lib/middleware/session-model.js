var Model = require('../model');

module.exports = function (options) {
    var name = options.settings.name;
    return function (req, res, next) {
        req.sessionModel = new Model({}, {
            session: req.session,
            key: name
        });
        next();
    };
};
