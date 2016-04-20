'use strict';

module.exports = {
  app: {
    session: require('./session')
  },
  controller: {
    'check-session': require('./check-session'),
    'check-progress': require('./check-progress'),
    'csrf': require('./csrf')
  },
  route: {
    'session-model': require('./session-model'),
    'back-links': require('./back-links'),
    translate: require('./translate')
  }
}
