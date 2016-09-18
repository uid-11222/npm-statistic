'use strict'; /* global describe, it  */
describe('npm-statistic', function() {

const fs = require('fs'),
      execFile = require('child_process').execFile,
      npmStatistic = require('../src/npm-statistic');

/**
 * Throw error, if value in not true.
 * @param  {*} value
 * @param  {string} msg
 * @throws {Error}
 */
const assert = (value, msg) => {
  if (value !== true) throw Error('Assert ' + (msg || ''));
};


describe('API', function() {

  it('exists', function() {

    assert(typeof npmStatistic === 'function');

  });

  it('works with empty args list', function() {

    npmStatistic([]);

  });

  it('throw without args array', function() {

    try {
      npmStatistic();
    } catch(e) {
      return;
    }

    assert(false);

  });

});

});