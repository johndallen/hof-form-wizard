'use strict';

module.exports = {
  steps: {
    '/one': {
      next: '/two',
      fields: ['fullname', 'country']
    },
    '/two': {
      next: '/three',
      fields: ['radios']
    },
    '/three': {
      next: '/four',
      fields: ['select']
    },
    '/four': {
      next: '/six',
      forks: [
        {
          target: '/three',
          condition: {
            field: 'loop',
            value: 'yes'
          }
        }
      ],
      fields: ['loop']
    },
    '/six': {
      next: '/seven-1',
      fields: ['fork'],
      forks: [
        {
          target: '/seven-2',
          condition: {
            field: 'fork',
            value: 'yes'
          }
        }
      ]
    },
    '/seven-1': {
      next: '/confirm',
      fields: ['field-1']
    },
    '/seven-2': {
      next: '/confirm',
      fields: ['field-2']
    },
    '/confirm': {
      behaviours: 'complete',
      next: '/confirmation'
    },
    '/confirmation': {}
  },
  fields: {
    fullname: {
      validate: 'required'
    },
    country: {
      validate: 'required'
    },
    loop: {
      mixin: 'radio-group',
      options: ['yes', 'no'],
      validate: 'required'
    },
    fork: {
      mixin: 'radio-group',
      options: ['yes', 'no'],
      validate: 'required'
    },
    select: {
      mixin: 'select',
      options: [
        { label: 'Select...', value: '' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ],
      validate: 'required'
    },
    radios: {
      mixin: 'radio-group',
      options: ['one', 'two', 'three'],
      validate: 'required'
    }
  }
};
