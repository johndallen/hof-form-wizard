'use strict';

const Wizard = require('../lib/wizard');
const StubController = require('./helpers/controller');
const request = require('./helpers/request');
const response = require('./helpers/response');

describe('Form Wizard', () => {
  let wizard;
  let requestHandler;
  let req;
  let res;
  let next;
  let obj;

  describe('settings', () => {
    beforeEach(() => {
      obj = {
        controller: StubController()
      };
      sinon.spy(obj, 'controller');
      wizard = Wizard({
        '/': {
          template: 'template',
          controller: obj.controller
        }
      }, {}, { templatePath: '/a/path' });
    });

    it('initialises a new controller', () => {
      obj.controller.should.have.been.calledOnce;
    });

    it('prepends templatePath to the tempate', () => {
      obj.controller.should.have.been.calledWithMatch({
        template: '/a/path/template'
      });
    });

    it('passes the route to the controller', () => {
      obj.controller.should.have.been.calledWithMatch({
        route: '/'
      });
    });

    it('doesn\'t prepend template path if omitted', () => {
      wizard = Wizard({
        '/': {
          template: 'template',
          controller: obj.controller
        }
      }, {}, {});
      obj.controller.should.have.been.calledWithMatch({
        template: 'template'
      });
    });
  });

  describe('session', () => {
    beforeEach(() => {
      req = request();
      res = response();
      next = sinon.stub();
      requestHandler = sinon.stub().yields();
      wizard = Wizard({
        '/': {
          controller: StubController({ requestHandler: requestHandler })
        }
      }, {}, { name: 'test', csrf: false });
    });

    it('creates a namespace on the session', done => {
      wizard(req, res, err => {
        req.session['hof-wizard-test'].should.eql({});
        done(err);
      });
    });

    it('creates a session model', done => {
      wizard(req, res, err => {
        req.sessionModel.should.be.an.instanceOf(require('hof-model'));
        done(err);
      });
    });

    it('initialises model with data from session', done => {
      req.session['hof-wizard-test'] = {
        name: 'John'
      };
      wizard(req, res, err => {
        req.sessionModel.toJSON().should.eql({ name: 'John' });
        done(err);
      });
    });
  });

  describe('fields', () => {
    it('includes all fields in fields option', () => {
      const constructor = sinon.stub();
      wizard = Wizard({
        '/': {
          controller: StubController({ constructor }),
          fields: ['field1', 'field2']
        }
      }, { field1: { validate: 'required' } }, { name: 'test-wizard' });

      constructor.args[0][0].fields.should.eql({
        field1: { validate: 'required' },
        field2: {}
      });
    });
  });

  describe('router params', () => {
    beforeEach(() => {
      res = response();
      next = sinon.stub();
    });

    it('binds additional params onto route', done => {
      req = request({
        url: '/step/edit'
      });
      // eslint-disable-next-line no-shadow
      requestHandler = (req, res, next) => {
        req.params.action.should.equal('edit');
        next();
      };
      wizard = Wizard({
        '/step': {
          controller: StubController({ requestHandler })
        }
      }, {}, { name: 'test-wizard', params: '/:action?' });
      wizard(req, res, err => {
        expect(err).not.to.be.ok;
        done(err);
      });
    });

    it('handles parameterless routes', done => {
      req = request({
        url: '/step'
      });
      // eslint-disable-next-line no-shadow
      requestHandler = (req, res, next) => {
        expect(req.params.action).to.be.undefined;
        next();
      };
      wizard = Wizard({
        '/step': {
          controller: StubController({ requestHandler })
        }
      }, {}, { name: 'test-wizard', params: '/:action?' });
      wizard(req, res, err => {
        expect(err).not.to.be.ok;
        done(err);
      });
    });
  });

  describe('middleware error handling', () => {
    beforeEach(() => {
      req = request();
      res = response();
      next = sinon.stub();
      requestHandler = sinon.stub().yields();
      sinon.stub(Wizard.Controller.prototype, 'errorHandler');
      wizard = Wizard({
        '/one': {
          next: '/two'
        },
        '/two': {
          next: '/three'
        },
        '/three': {}
      }, {}, { name: 'test', csrf: false });
    });

    afterEach(() => {
      Wizard.Controller.prototype.errorHandler.restore();
    });

    describe('check progress', () => {
      it('catches pre-requisite errors at the controller error handler', () => {
        req.url = '/three';
        wizard.handle(req, res, next);
        Wizard.Controller.prototype.errorHandler.should.have.been.calledOnce;
        Wizard.Controller.prototype.errorHandler.args[0][0].should.have.property('code');
        Wizard.Controller.prototype.errorHandler.args[0][0].code.should.equal('MISSING_PREREQ');
      });
    });

    describe('check session', () => {
      it('catches missing session errors at the controller error handler', () => {
        req.url = '/two';
        req.cookies['hof-wizard-sc'] = 1;
        req.session.exists = false;
        wizard.handle(req, res, next);
        Wizard.Controller.prototype.errorHandler.should.have.been.calledOnce;
        Wizard.Controller.prototype.errorHandler.args[0][0].should.have.property('code');
        Wizard.Controller.prototype.errorHandler.args[0][0].code.should.equal('SESSION_TIMEOUT');
      });
    });
  });

  describe('app middlewares', () => {
    beforeEach(() => {
      req = request();
      res = response();
      next = sinon.stub();
      requestHandler = sinon.stub().yields();
      wizard = Wizard({
        '/': {
          controller: StubController({ requestHandler })
        }
      }, {}, { name: 'test', csrf: false, translate: 'i18ntranslator' });
    });

    describe('applying a translate', () => {
      it('sets translate to the req when defined in settings', done => {
        should.equal(req.translate, undefined);
        wizard(req, res, err => {
          req.translate.should.equal('i18ntranslator');
          done(err);
        });
      });
    });
  });
});
