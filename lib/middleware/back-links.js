var url = require('url'),
    path = require('path'),
    _ = require('underscore');

var BackLink = function BackLink(options) {
    this.route = options.route;
    this.controller = options.controller;
    this.steps = options.steps;

    this.previousSteps = _.reduce(this.steps, function (list, step, path) {
        if (step.next === this.route) {
            list.push(path);
        }
        return list;
    }.bind(this), []);

    return function(req, res, next) {
        if (req.method === 'GET') {
            var last = _.last(req.sessionModel.get('steps'));
            req.isBackLink = (last === this.route || last === this.controller.options.next);
            res.locals.backLink = this.getBackLink(req);
        }
        next();
    }.bind(this);
};

BackLink.prototype.getBackLink = function getBackLink(req) {
  var previous = _.intersection(req.sessionModel.get('steps'), this.previousSteps),
      backLink;

  if (typeof this.controller.options.backLink !== 'undefined') {
      return this.controller.options.backLink;
  } else if (previous.length) {
      backLink = _.last(previous).replace(/^\//, '');
  } else if (this.controller.options.backLinks && req.get('referrer')) {
      backLink = this.checkReferrer(req.get('referrer'), req.baseUrl) || this.checkFormHistory(req.session);
  }

  return backLink;
};

BackLink.prototype.checkReferrer = function checkReferrer(referrer, baseUrl) {
  var referrerPath = url.parse(referrer).path;
  var matchingPath = _.find(this.controller.options.backLinks, function (link) {
      if (link.match(/^\//)) {
          return path.normalize(link) === referrerPath;
      } else {
          return path.normalize(link) === path.relative(baseUrl, referrerPath);
      }
  });
  if (typeof matchingPath === 'string') {
      return path.normalize(matchingPath);
  }
};

BackLink.prototype.checkFormHistory = function checkFormHistory(sessionData) {
  var previousSteps = _.chain(sessionData)
      .pick(function(value, key, object) {
          return key.indexOf('hmpo-wizard') > -1;
      })
      .pluck('steps')
      .flatten()
      .uniq()
      .value();

  var allowedLinks = _.map(this.controller.options.backLinks, function(item) {
      return item.replace('\.', '');
  });

  var backLinks = _.intersection(previousSteps, allowedLinks);

  return (backLinks.length) ? _.last(backLinks).replace(/^\//, '') : undefined;
};

module.exports = BackLink;
