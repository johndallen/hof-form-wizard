'use strict';

const Browser = require('./lib/browser');
const App = require('./lib/app');
const assert = require('assert');

describe('tests', () => {

  let browser;
  let app;
  let port;

  before(() => {
    app = App(require('./apps/default')).listen();
    port = app.address().port;
  });

  after(() => {
    app.close();
  });

  beforeEach(() => {
    browser = Browser().url(`http://localhost:${port}`);
    return browser;
  });

  afterEach(() => {
    return browser.end();
  });

  it('can return to a looping step to edit', () => {
    return browser.goto('/confirm', { loop: 'no', fork: 'no' })
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/confirm'));
      })
      .url(`http://localhost:${port}/two/edit`)
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/two/edit'));
      });
  });

  it('prevents accessing a looping step once the loop has been started', () => {
    return browser.goto('/two')
      .$('input[name="loop"][value="yes"]').click()
      .submitForm('form')
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/one'));
      })
      .url(`http://localhost:${port}/two`)
      .getUrl()
      .then((url) => {
        assert.ok(!url.includes('/two'));
        assert.ok(url.includes('/one'));
      });
  });

  it('cannot go back to confirm page after editing a forking step', () => {
    return browser.goto('/confirm', { loop: 'no', fork: 'no' })
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('confirm'));
      })
      .url(`http://localhost:${port}/three/edit`)
      .$('input[name="fork"][value="yes"]').click()
      .submitForm('form')
      .url(`http://localhost:${port}/confirm`)
      .getUrl()
      .then((url) => {
        assert.ok(!url.includes('/confirm'));
      });
  });

  it('does not autocomplete confirm page', () => {
    return browser.goto('/confirm', { loop: 'no', fork: 'no' })
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('confirm'));
      })
      .url(`http://localhost:${port}/confirmation`)
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/confirm'));
      });
  });

  describe('with loop preceding confirm page', () => {

    before(() => {
      app = App(require('./apps/loop-before-confirm')).listen();
      port = app.address().port;
    });

    after(() => {
      app.close();
    });

    it('allows returning to the confirmation page from a loop page in an edit journey', () => {
      return browser.goto('/confirm')
        .url(`http://localhost:${port}/two/edit`)
        .$('input[name="loop"][value="no"]').click()
        .submitForm('form')
        .getUrl()
        .then((url) => {
          assert.ok(url.includes('/confirm'));
        });
    });

  });

});
