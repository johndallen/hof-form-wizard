'use strict';

const constants = require('../util/constants');

module.exports = (route, controller, steps, start) => {
  return (req, res, next) => {
    if (req.sessionModel.get(constants.APPLICATION_COMPLETE) && !controller.options.allowPostComplete) {
      req.sessionModel.reset();
      res.redirect(start);
    }
    next();
  };
};
