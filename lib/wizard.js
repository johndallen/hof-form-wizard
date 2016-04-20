var express = require('express'),
    util = require('util'),
    _ = require('underscore'),
    Form = require('./controller');

var count = 0;

var Wizard = function (steps, fields, settings) {

    settings = _.extend({
        templatePath: 'pages',
        params: '',
        controller: Form
    }, settings || {});

    middleware = _.extend(require('./middleware'), settings.middleware || {});

    // prevent potentially conflicting session namespaces
    if (!settings.name) {
        settings.name = count;
        count++;
    }

    settings.name = 'hmpo-wizard-' + settings.name;

    var app = express.Router();

    _.each(middleware.app, function (appMiddleware) {
      app.use(appMiddleware);
    });

    var first;

    _.each(steps, function (options, route) {

        first = first || route;

        options = _.clone(options);

        options.fields = _.object(options.fields, _.map(options.fields, function(f) { return fields[f] || {}; }));
        options.steps = steps;

        // default template is the same as the pathname
        options.template = options.template || route.replace(/^\//, '');
        options.template = settings.templatePath + '/' + options.template;

        var Controller = options.controller || settings.controller;

        var controller = new Controller(options);

        if (settings.csrf === false) {
          delete middleware.controller.csrf;
        }

        var middlewareOptions = {
          route: route,
          controller: controller,
          steps: steps,
          first: first,
          settings: settings
        };

        _.each(middleware.controller, function (controllerMiddleware) {
          controller.use(controllerMiddleware(middlewareOptions));
        });

        _.each(middleware.route, function (routeMiddleware) {
          app.route(route + settings.params)
            .all(new routeMiddleware(middlewareOptions));
        });

        app.route(route + settings.params)
            .all(controller.requestHandler());

    });

    return app;

};

Wizard.Controller = Form;
Wizard.Error = Form.Error;

module.exports = Wizard;
