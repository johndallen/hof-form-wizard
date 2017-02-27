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
      .url(`http://localhost:${port}/four/edit`)
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/four/edit'));
      });
  });

  it('prevents accessing a looping step once the loop has been started', () => {
    return browser.goto('/four')
      .$('input[name="loop"][value="yes"]').click()
      .submitForm('form')
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('/three'));
      })
      .url(`http://localhost:${port}/four`)
      .getUrl()
      .then((url) => {
        assert.ok(!url.includes('/four'));
        assert.ok(url.includes('/three'));
      });
  });

  it('cannot go back to confirm page after editing a forking step', () => {
    return browser.goto('/confirm', { loop: 'no', fork: 'no' })
      .getUrl()
      .then((url) => {
        assert.ok(url.includes('confirm'));
      })
      .url(`http://localhost:${port}/six/edit`)
      .$('input[name="fork"][value="yes"]').click()
      .submitForm('form')
      .url(`http://localhost:${port}/confirm`)
      .getUrl()
      .then((url) => {
        assert.ok(!url.includes('/confirm'));
      });
  });

});
