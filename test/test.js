'use strict'; /* global describe, it  */
describe('npm-statistic', function() {

const fs = require('fs'),
      execFile = require('child_process').execFile,
      npmStatistic = require('../src/npm-statistic');

const CONFIG = `${__dirname}/../config.json`,
      LOGS = `${__dirname}/../logs.txt`,
      STATS = `${__dirname}/../stats/`,
      UNDEF = `undefined`;

const UPDATE = `update`, SET = `set`, GET = `get`,
      ADD = `add`, SHOW = `show`, HELP = `help`;

/**
 * Throw error, if value in not true.
 * @param  {*} value
 * @param  {string} msg
 * @throws {Error}
 */
const assert = (value, msg) => {
  if (value !== true) throw Error('Assert ' + (msg || ''));
};

/**
 * Sync reading JSON from file.
 * @param  {string} name Filename.
 * @return {?Object} Parse JSON value (null if no such file).
 */
const readJSON = name => {
  try {
    return JSON.parse(fs.readFileSync(name, 'utf8'));
  } catch(e) { return null; }
};


describe('API', function() {

  it('exists', function() {

    assert(typeof npmStatistic === 'function');

  });

  it('works with empty args list', function() {

    npmStatistic([]);

  });

  it('works with array of string args', function() {

    npmStatistic([`abc`, `def`]);

  });

  it('throw without args array', function() {

    try {
      npmStatistic();
    } catch(e) {
      return;
    }

    assert(false);

  });

  it('throw with string arg', function() {

    try {
      npmStatistic(`string`);
    } catch(e) {
      return;
    }

    assert(false);

  });

});

describe(SET, function() {

  it('set string value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `foo`;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field] === value);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set string value in quotes', function() {

    const field = `__tmp_${Date.now()}`,
          value = `"foo"`;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field] === JSON.parse(value));

    npmStatistic([SET, field, UNDEF]);

  });

  it('set number value', function() {

    const field = `__tmp_${Date.now()}`,
          value = -13;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field] === value);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set null value', function() {

    const field = `__tmp_${Date.now()}`,
          value = null;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field] === value);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set undefined value (delete field)', function() {

    const field = `__tmp_${Date.now()}`,
          value = UNDEF;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(!config.hasOwnProperty(field));

  });

  it('set object value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `{"foo": "bar"}`;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field].foo === `bar`);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set array value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `["foo", "bar"]`;

    npmStatistic([SET, field, value]);

    const config = readJSON(CONFIG);

    assert(config[field][1] === `bar`);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set deep value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `bar`;

    npmStatistic([SET, field, `{}`]);
    npmStatistic([SET, `${field}.foo`, value]);

    const config = readJSON(CONFIG);

    assert(config[field].foo === value);

    npmStatistic([SET, field, UNDEF]);

  });

  it('set deep value with index', function() {

    const field = `__tmp_${Date.now()}`,
          value = `bar`;

    npmStatistic([SET, field, `[]`]);
    npmStatistic([SET, `${field}.4`, value]);

    const config = readJSON(CONFIG);

    assert(config[field][4] === value);

    npmStatistic([SET, field, UNDEF]);

  });

});

describe(GET, function() {

  it('get string value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `foo`;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(value));
        ++called;
      };

      npmStatistic([GET, field]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get number value', function() {

    const field = `__tmp_${Date.now()}`,
          value = 13;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(value));
        ++called;
      };

      npmStatistic([GET, field]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get null value', function() {

    const field = `__tmp_${Date.now()}`,
          value = null;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(value));
        ++called;
      };

      npmStatistic([GET, field]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get object value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `{"foo": "bar"}`;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(`foo`));
        assert(str.includes(`bar`));
        assert(str.includes(`{`));
        assert(str.includes(`}`));
        ++called;
      };

      npmStatistic([GET, field]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get array value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `["foo", "bar"]`;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(`foo`));
        assert(str.includes(`bar`));
        assert(str.includes(`[`));
        assert(str.includes(`]`));
        ++called;
      };

      npmStatistic([GET, field]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get deep value', function() {

    const field = `__tmp_${Date.now()}`,
          value = `{"foo": "bar"}`;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(`bar`));
        ++called;
      };

      npmStatistic([GET, `${field}.foo`]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

  it('get deep value with index', function() {

    const field = `__tmp_${Date.now()}`,
          value = `["foo", "bar"]`;

    npmStatistic([SET, field, value]);

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(`bar`));
        ++called;
      };

      npmStatistic([GET, `${field}.1`]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

  });

});

});