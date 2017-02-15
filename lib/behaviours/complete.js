'use strict';

const constants = require('../util/constants');

module.exports = (superclass) => class extends superclass {

  successHandler(req, res, callback) {
    req.sessionModel.set(constants.APPLICATION_COMPLETE, true);
    super.successHandler(req, res, callback);
  }

};
