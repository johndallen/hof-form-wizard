'use strict';

const check = require('../../lib/middleware/check-complete');
const APPLICATION_COMPLETE = require('../../lib/util/constants').APPLICATION_COMPLETE;
const request = require('../helpers/request');
const response = require('../helpers/response');

describe('Check complete middleware', () => {
  let req;
  let res;
  let middleware;

  beforeEach(() => {
    req = request();
    res = response();
    middleware = check('/', { options: {} }, {}, '/first');
  });

  it('redirects to the first step if the model is marked as complete', () => {
    req.sessionModel.set(APPLICATION_COMPLETE, true);
    middleware(req, res, () => {});
    res.redirect.should.have.been.calledWith('/first');
  });

  it('includes req.baseUrl in redirect', () => {
    req.baseUrl = '/foo';
    req.sessionModel.set(APPLICATION_COMPLETE, true);
    middleware(req, res, () => {});
    res.redirect.should.have.been.calledWith('/foo/first');
  });

  it('passes through if the model is not marked as complete', () => {
    const stub = sinon.stub();
    req.sessionModel.unset(APPLICATION_COMPLETE);
    middleware(req, res, stub);
    res.redirect.should.not.have.been.called;
    stub.should.have.been.calledWithExactly();
  });

  it('passes through if the controller has an `allowPostComplete` option set to true', () => {
    const stub = sinon.stub();
    middleware = check('/', { options: { allowPostComplete: true } }, {}, '/first');
    req.sessionModel.unset(APPLICATION_COMPLETE);
    middleware(req, res, stub);
    res.redirect.should.not.have.been.called;
    stub.should.have.been.calledWithExactly();
  });

});
