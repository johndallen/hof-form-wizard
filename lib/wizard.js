'use strict';

const path = require('path');
const express = require('express');
const _ = require('lodash');
const deprecate = require('deprecate');
const FormController = require('hof-form-controller');
const mix = require('mixwith').mix;

const IncludedBehaviours = require('./behaviours');

let count = 0;

const getController = (SuperClass, behaviours) => {
  behaviours = behaviours ? _.castArray(behaviours) : [];
  if (!behaviours.length) {
    return SuperClass;
  }
  behaviours = behaviours.map(behaviour => {
    return typeof behaviour === 'string' ? IncludedBehaviours[behaviour] : behaviour;
  });
  /*
   * This class declaration could be better written using
   * array spread syntax, supported in node >= 5.11.0:
   *
   * class Controller extends mix(SuperClass).with(...behaviours) {}
   */
  const _mix = mix(SuperClass);
  return class extends _mix.with.apply(_mix, behaviours) {};
};

const Wizard = (steps, fields, settings) => {
  settings = Object.assign({
    params: '/:action?',
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

  if (!steps['/']) {
    app.get('/', (req, res) => {
      res.redirect(path.join(req.baseUrl, first));
    });
  }

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
    options.clearSession = options.clearSession || false;
    options.fieldsConfig = _.cloneDeep(fields);

    // default template is the same as the pathname
    options.template = options.template || route.replace(/^\//, '');
    if (settings.templatePath) {
      options.template = settings.templatePath + '/' + options.template;
    }

    options.i18n = settings.i18n;

    if (options.controller) {
      deprecate(
        'hof-form-wizard: Passing a custom step controller is deprecated',
        'Instead give one or more behaviours which will be mixed in to the base controller'
      );
    }

    const SuperClass = options.controller || settings.controller;
    const Controller = getController(SuperClass, options.behaviours);
    const controller = new Controller(options);

    controller.use([
      require('./middleware/check-session')(route, controller, steps, first),
      require('./middleware/check-complete')(route, controller, steps, first),
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
