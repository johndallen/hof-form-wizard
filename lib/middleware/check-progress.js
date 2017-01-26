'use strict';

const _ = require('lodash');
const debug = require('debug')('hof:progress-check');
const helpers = require('../util/helpers');

module.exports = (route, controller, steps, start) => {
  start = start || '/';
  const previousSteps = helpers.getRouteSteps(route, steps);
  const prereqs = (controller.options.prereqs || []).concat(previousSteps);

  const invalidatingFields = _.pickBy(controller.options.fields, field => {
    return field && field.invalidates && field.invalidates.length;
  });

  const getAllPossibleSteps = (stepName, scopedSteps, allSteps) => {
    allSteps = allSteps || [stepName];
    let step = scopedSteps[stepName];
    const forksReducer = (arr, fork) => getAllPossibleSteps(fork, scopedSteps, allSteps);
    // don't loop over steps that have already been added
    while (step && step.next && allSteps.indexOf(step.next) === -1) {
      allSteps.push(step.next);
      // ignore forks that have already been traversed.
      const forks = _.difference(_.map(step.forks, 'target'), allSteps);
      allSteps = allSteps.concat(forks.reduce(forksReducer, []));
      step = scopedSteps[step.next];
    }
    return _.uniq(allSteps);
  };

  const invalidateStep = (stepName, scopedSteps, sessionModel) => {
    debug('Invalidating', stepName);
    const step = scopedSteps[stepName] || {};
    sessionModel.unset(step.fields || []);
    sessionModel.set('steps', _.without(sessionModel.get('steps'), stepName));
  };

  const invalidatePath = (req, res) => {
    const potentialPaths = _.map(controller.options.forks, 'target')
      .concat(controller.options.next);
    const nextStep = controller.getForkTarget(req, res);

    if (req.baseUrl !== '/') {
      nextStep = nextStep.replace((new RegExp('^' + req.baseUrl)), '');
    }
    const validateSteps = getAllPossibleSteps(nextStep, steps);

    const invalidateSteps = _.without(potentialPaths, nextStep).reduce((arr, step) => {
      return arr.concat(getAllPossibleSteps(step, steps));
    }, []);

    _.difference(invalidateSteps, validateSteps).forEach(step => {
      invalidateStep(step, steps, req.sessionModel);
    });
  };

  controller.on('complete', (req, res, path) => {

    if (req.method === 'POST' && controller.options.forks) {
      invalidatePath(req, res);
    }

    const sessionsteps = req.sessionModel.get('steps') || [];
    path = path || route;
    debug('Marking path complete ', path);
    const index = sessionsteps.indexOf(path);
    if (index > -1) {
      sessionsteps.splice(index, 1);
    }
    if (path === start) {
      sessionsteps = [];
    }
    sessionsteps.push(path);
    req.sessionModel.set('steps', sessionsteps);
  });

  return (req, res, next) => {
    _.each(invalidatingFields, (field, key) => {
      req.sessionModel.on('change:' + key, () => {
        debug('Unsetting fields %s', field.invalidates.join(', '));
        req.sessionModel.unset(field.invalidates);
      });
    });

    const visited = _.intersection(req.sessionModel.get('steps'), prereqs);

    debug('Steps ', req.sessionModel.get('steps'));
    debug('Prereqs ' + prereqs);
    debug('Visited ' + visited);
    if (visited.length || !prereqs.length) {
      next();
    } else {
      const err = new Error('Missing prerequisite');
      err.code = 'MISSING_PREREQ';
      next(err);
    }
  };
};
