'use strict';

const BaseController = require('hof-form-controller');
const mix = require('mixwith').mix;
const Complete = require('../../lib/behaviours').complete;
const APPLICATION_COMPLETE = require('../../lib/util/constants').APPLICATION_COMPLETE;
const request = require('../helpers/request');
const response = require('../helpers/response');
const sandbox = require('mocha-sandbox');

class Controller extends mix(BaseController).with(Complete) {}

describe('Complete Behaviour', () => {

  let req;
  let res;
  let controller;

  beforeEach(() => {
    req = request();
    res = response();
    controller = new Controller({});
    sinon.stub(BaseController.prototype, 'successHandler').yieldsAsync();
  });

  afterEach(() => {
    BaseController.prototype.successHandler.restore();
  });

  describe('successHandler', () => {

    it('marks session model as complete', (done) => {
      controller.successHandler(req, res, sandbox(() => {
        req.sessionModel.get(APPLICATION_COMPLETE).should.equal(true);
      }, done));
    });

    it('passes through to super method', (done) => {
      controller.successHandler(req, res, sandbox(() => {
        BaseController.prototype.successHandler.should.have.been.calledWith(req, res);
      }, done));
    });

  });

});
