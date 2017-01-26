'use strict';

const express = require('express');
const _ = require('lodash');
const FormController = require('./controller');

let count = 0;

const Wizard = (steps, fields, settings) => {
  settings = Object.assign({
    params: '',
    controller: FormController
  }, settings || {});

  // prevent potentially conflicting session namespaces
  if (!settings.name) {
    settings.name = count;
    count++;
  }

  settings.name = `hof-wizard-${settings.name}`;

  const app = express.Router();

  app.use(require('./middleware/session'));

  let first;

  _.each(steps, (options, route) => {
    first = first || route;

    options = _.cloneDeep(options);

    options.fields = (options.fields || []).reduce((obj, field) => {
      obj[field] = fields[field] || {};
      return obj;
    }, {});
    options.steps = steps;
    options.route = route;
    options.appConfig = settings.appConfig;

    // default template is the same as the pathname
    options.template = options.template || route.replace(/^\//, '');
    if (settings.templatePath) {
      options.template = settings.templatePath + '/' + options.template;
    }

    const Controller = options.controller || settings.controller;

    const controller = new Controller(options);

    controller.use([
      require('./middleware/check-session')(route, controller, steps, first),
      require('./middleware/check-progress')(route, controller, steps, first)
    ]);
    if (settings.csrf !== false) {
      controller.use(require('./middleware/csrf')(route, controller, steps, first));
    }

    app.route(route + settings.params)
    .all((req, res, next) => {
      if (settings.translate) {
        req.translate = settings.translate;
      }
      next();
    })
    .all(require('./middleware/session-model')(settings))
    .all(require('./middleware/back-links')(route, controller, steps, first))
    .all(controller.requestHandler());


  });

  return app;
};

Wizard.Controller = FormController;
Wizard.Error = FormController.Error;

module.exports = Wizard;
