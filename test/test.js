'use strict'; /* global describe, it  */
describe('npm-statistic', function() {

const fs = require('fs'),
      execFile = require('child_process').execFile,
      npmStatistic = require('../src/npm-statistic');

const CONFIG = `${__dirname}/../config.json`,
      LOGS_FILE = `${__dirname}/../logs.txt`,
      STATS = `${__dirname}/../stats/`,
      UNDEF = `undefined`,
      SELF = `npm-statistic`,
      MAIN = `src/${SELF}.js`;

/**
 * Commands.
 */
const UPDATE = `update`, SET = `set`, GET = `get`,
      ADD = `add`, SHOW = `show`, LAST = `last`,
      HELP = `help`, LOGS = `logs`;

const ADDED = `already added`,
      NOT_A_COMMAND = `NOT_A_COMMAND`,
      NOT_A_PACKAGE = `NOT_A_PACKAGE`,
      PUB = `publishDate`,
      SELF_OUT = `${SELF}: `;

const UPDATE_TIMEOUT = 32 * 1024;

/**
 * Throw error, if value is not true.
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

/**
 * Throw error, if str is not contain all commands.
 * @param  {string} Help text.
 * @throws {Error}
 */
const assertHelp = str => {
  assert(str.includes(SET));
  assert(str.includes(GET));
  assert(str.includes(ADD));
  assert(str.includes(LAST));
  assert(str.includes(HELP));
  assert(str.includes(UPDATE));
  assert(str.includes(SHOW));
};

describe('API', function() {

  it('exists', function() {

    assert(typeof npmStatistic === 'function');

  });

  it('works with array of string args', function() {

    npmStatistic([NOT_A_COMMAND, `foo`]);

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

  it(`get error with unknown command`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.error = str => {
        assert(str.includes(NOT_A_COMMAND));
        assert(str.includes(`Unknown`));
        ++called;
      };

      console.log = () => assert(false);

      npmStatistic([NOT_A_COMMAND]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

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

  it('show message after setting', function() {

    const field = `__tmp_${Date.now()}`,
          value = `foo`;

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(value));
        ++called;
      };

      npmStatistic([SET, field, value]);
      assert(called === 1);

    } finally {

      console.log = log;
      npmStatistic([SET, field, UNDEF]);

    }

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

describe(ADD, function() {

  it('show error when package name missed', function() {

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(`miss`));
        ++called;
      };

      npmStatistic([ADD]);
      assert(called === 1);

    } finally {
      console.log = log;
    }

  });

  it('add packages', function() {

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(SELF));
        ++called;
      };

      npmStatistic([ADD, SELF]);
      assert(called === 1);

      const config = readJSON(CONFIG);
      assert(
        config.packages.filter(pack => pack.name === SELF).length === 1
      );

    } finally {
      console.log = log;
    }

  });

  it(`do not add ${ADDED} packages`, function() {

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(ADDED));
        assert(str.includes(SELF));
        ++called;
      };

      npmStatistic([ADD, SELF]);
      assert(called === 1);

    } finally {
      console.log = log;
    }

  });

});

describe(HELP, function() {

  it(`show help for all commands`, function() {

    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assertHelp(str);
        ++called;
      };

      npmStatistic([HELP]);
      assert(called === 1);

    } finally {
      console.log = log;
    }

  });

});

describe(`FS`, function() {

  it(`has ${LOGS_FILE}`, function() {
    fs.accessSync(LOGS_FILE);
  });

  it(`has ${STATS}`, function() {
    fs.accessSync(STATS);
  });

});

describe('bash command', function() {

  it(`exists as ${MAIN}`, function(done) {

    execFile(MAIN, [HELP], done)
      .stderr.on('data', data => assert(false, data));

  });

  it(`get error with unknown command`, function(done) {

    let hasOut = false;
    const exec = execFile(MAIN, [NOT_A_COMMAND], error => {
      assert(!error);
      assert(hasOut);
      done();
    });

    exec.stdout.on('data', data => assert(false, data));
    exec.stderr.on('data', data => {
      assert(data.includes(`Unknown`));
      assert(data.includes(NOT_A_COMMAND));
      assert(!hasOut);
      hasOut = true;
    });

  });

  it('set string value', function(done) {

    const field = `__tmp_${Date.now()}`,
          value = `foo`;

    execFile(MAIN, [SET, field, value], () => {

      const config = readJSON(CONFIG);

      assert(config[field] === value);

      execFile(MAIN, [SET, field, UNDEF], done);

    }).stderr.on('data', data => assert(false, data));

  });

  it('get string value', function(done) {

    const field = `__tmp_${Date.now()}`,
          value = `foo`;

    execFile(MAIN, [SET, field, value], () => {

      let hasOut = false;
      const exec = execFile(MAIN, [GET, field], error => {
        assert(!error);
        assert(hasOut);
        execFile(MAIN, [SET, field, UNDEF], done)
          .stderr.on('data', data => assert(false, data));
      });

      exec.stderr.on('data', data => assert(false, data));
      exec.stdout.on('data', data => {
        assert(data.includes(value));
        assert(!hasOut);
        hasOut = true;
      });

    }).stderr.on('data', data => assert(false, data));

  });

  it(`show ${HELP}`, function(done) {

    let hasOut = false;
    const exec = execFile(MAIN, [HELP], error => {
      assert(!error);
      assert(hasOut);
      done();
    });

    exec.stderr.on('data', data => assert(false, data));
    exec.stdout.on('data', data => {
      assertHelp(data);
      assert(!hasOut);
      hasOut = true;
    });

  });

  it(`do not add ${ADDED} package`, function(done) {

    let hasOut = false;
    const exec = execFile(MAIN, [ADD, SELF], error => {
      assert(!error);
      assert(hasOut);
      done();
    });

    exec.stderr.on('data', data => assert(false, data));
    exec.stdout.on('data', data => {
      assert(data.includes(ADDED));
      assert(!hasOut);
      hasOut = true;
    });

  });

  it(UPDATE, function(done) {

    const exec = execFile(MAIN, [UPDATE]);

    exec.stderr.on('data', data => assert(false, data));
    exec.stdout.on('data', data => {
      if (data.includes(`Update "${SELF}"`)) done();
    });

    this.timeout(UPDATE_TIMEOUT);

  });

  it(`${SHOW} stats`, function(done) {

    let hasOut = false;
    const exec = execFile(MAIN, [SHOW, SELF], error => {
      assert(!error);
      assert(hasOut);
      done();
    });

    exec.stderr.on('data', data => assert(false, data));
    exec.stdout.on('data', data => {
      assert(data.includes(SELF));
      assert(data.includes(PUB));
      assert(!hasOut);
      hasOut = true;
    });

  });

  it(`show ${LAST} packages stats`, function(done) {

    let hasOut = false;
    const exec = execFile(MAIN, [LAST], error => {
      assert(!error);
      assert(hasOut);
      done();
    });

    exec.stderr.on('data', data => assert(false, data));
    exec.stdout.on('data', data => {
      assert(data.includes(SELF_OUT));
      assert(!hasOut);
      hasOut = true;
    });

  });

});

describe(SHOW, function() {

  it(`${SHOW} stats`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(SELF));
        assert(str.includes(PUB));
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([SHOW, SELF]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

  it(`${SHOW} sliced stats`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(SELF), str);
        assert(str.includes(PUB), str);
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([SHOW, `-1`, SELF]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

  it(`do not ${SHOW} stats for nonexistent package`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(NOT_A_PACKAGE), str);
        assert(str.includes(`No statistic`), str);
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([SHOW, NOT_A_PACKAGE]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

});

describe(LAST, function() {

  it(`show ${LAST} stats`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(SELF_OUT));
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([LAST]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

  it(`show ${LAST} stats with several fields`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(str.includes(SELF_OUT));
        assert(str.includes(UNDEF));
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([LAST, `day`, `week`, NOT_A_COMMAND]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

});

describe(LOGS, function() {

  it(`show ${LOGS}`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(typeof str === `string`);
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([LOGS]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

  it(`show ${LOGS} with number`, function() {

    const error = console.error;
    const log = console.log;
    let called = 0;

    try {

      console.log = str => {
        assert(typeof str === `string`);
        ++called;
      };

      console.error = () => assert(false);

      npmStatistic([LOGS, `-2`]);
      assert(called === 1);

    } finally {

      console.error = error;
      console.log = log;

    }

  });

});


});