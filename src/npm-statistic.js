#!/usr/bin/env node

'use strict'; /* globals process */

const fs = require('fs'),
      https = require('https'),
      util = require('util');

const UPDATE = `update`, SET = `set`, GET = `get`,
      ADD = `add`, SHOW = `show`, LAST = `last`, HELP = `help`;

const DEFAULT_TIMEOUT = 16 * 1024,
      DEFAULT_ATTEMPTS = 4,
      MAX_OPENED_REQUESTS = 2,
      RETRY_TIMEOUT = 512;

const CONFIG = `${__dirname}/../config.json`,
      LOGS   = `${__dirname}/../logs.txt`,
      STATS  = `${__dirname}/../stats/`;

const COMMANDS = {};

const PERIODS = [`day`, `week`, `month`].map(period => ({
        period, reg: RegExp(
          (period === 'day' ? 'dai' : period) +
          `ly-downloads[^\\d]+(\\d+)<\\/strong>`
        )
      }));

const CANT = `Cannot find`, NO_NAME = `no-name-packages`,
      CREATE = `Create new empty`, NO_PACKAGES = `No active packages`;

/**
 * Update stat, get/set config params, show stat.
 * @param {string[]} args 
 */
const npmStatistic = module.exports = args => {

  if (!args[0]) args[0] = UPDATE;

  const command = args.shift();

  try {
    fs.accessSync(CONFIG);
  } catch(e) {
    console.log(`${CANT} config ("${CONFIG}"). ${CREATE} config.`);
    writeJSON(CONFIG, {});
  }

  try {
    fs.accessSync(STATS);
  } catch(e) {
    fs.mkdirSync(STATS);
  }

  try {
    fs.accessSync(LOGS);
  } catch(e) {
    log(`${CREATE} log file.`);
  }

  let config = readJSON(CONFIG);

  if (!config) {
    console.error(`Wrong config format (in "${CONFIG}").`);
    return;
  }

  if (!COMMANDS.hasOwnProperty(command)) {
    console.error(`Unknown command: "${command}".`);
    return;
  }

  const ctx = {
    start: Date.now(),
    left: getActivePackages(config).length,
    attempts: {},
    open: 0
  };

  COMMANDS[command](args, config, ctx);
};

/**
 * Get list of active packages from config.
 * @param  {Object} config
 * @return {Object[]} List of packages for updating stats.
 */
const getActivePackages = config => config && config.packages ?
  config.packages.filter(pack => pack && !pack.skip) : [];

/**
 * Common logger.
 * @param {*}
 */
const log = msg => {

  const data = `${msg}`;
  console.log(data);

  fs.appendFileSync(LOGS, `${new Date()}. ${data}\n`);
};

/**
 * Sync writing JSON to file.
 * @param {string} name Filename.
 * @param {string} data JSON value.
 */
const writeJSON = (name, data) => {
  fs.writeFileSync(name, JSON.stringify(data));
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

const hasOwn = COMMANDS.hasOwnProperty;

/**
 * Get JSON part by keys array.
 * @param  {Object} json
 * @param  {string[]} keys
 * @return {*} json[key[0]][key[1]]...
 */
const getJsonPart = (json, keys) => {
  let value = json, key;
  for (key of keys) {
    if (value && hasOwn.call(value, key)) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
};

/**
 * Get statistic file name for current month.
 * @return {string}
 */
const getStatName = () => {

  const now = new Date(),
        year = now.getFullYear();

  let month = now.getMonth() + 1;
  if (month < 10) month = '0' + month;

  return `${month}.${year}`;
};

/**
 * Get config parts.
 * @param {string[]} args
 * @param {Object} config
 */
COMMANDS[GET] = (args, config) => {

  const keys = args[0] === undefined ? [] : args[0].split('.');

  console.log(util.inspect(getJsonPart(config, keys)));

};

/**
 * Set config parts.
 * @param {string[]} args
 * @param {Object} config
 */
COMMANDS[SET] = (args, config) => {

  if (args.length < 2) {
    console.log(`Not enough arguments.`);
    return;
  }

  const keys = args[0].split('.'),
        key = keys.pop(),
        obj = getJsonPart(config, keys);

  if (!obj || typeof obj !== 'object') {
    console.log(`Cannot set key "${key}" in "${keys.join('.')}".`);
    return;
  }

  let value;
  try {
    value = JSON.parse(args[1]);
  } catch(e) {
    value = args[1];
    if (value === `undefined`) value = undefined;
  }

  obj[key] = value;
  writeJSON(CONFIG, config);

  console.log(`Set ${args[0]} = ${util.inspect(value)}.`);
};

/**
 * Add package name to config list.
 * @param {string[]} args
 * @param {Object} config
 */
COMMANDS[ADD] = (args, config) => {

  if (args.length === 0) {
    console.log(`Package name missed.`);
    return;
  }

  const name = args[0];

  if (!config.packages) config.packages = [];

  const such = config.packages.filter(pack => pack && pack.name === name);

  if (such.length) {
    console.log(`Such package already added (${util.inspect(such[0])}).`);
    return;
  }

  COMMANDS[SET](
    [`packages.${config.packages.length}`, `{"name": "${name}"}`],
    config
  );
};

/**
 * Show full statistics of package by name.
 * @param {string[]} args
 */
COMMANDS[SHOW] = args => {

  if (args.length === 0) {
    console.log(`Package name missed.`);
    return;
  }

  let num = Number(args[0]) || 0;
  if (args.length > 1 && String(num) === args[0]) {
    args.shift();
  } else {
    num = 0;
  }

  const name = args[0],
        dir = STATS + name + '/';

  try {
    fs.accessSync(dir);
  } catch(e) {
    console.log(`No statistic for package "${name}".`);
    return;
  }

  const month = args[1] ? args[1] : getStatName(),
        statName = `${dir}${month}.json`;

  try {
    fs.accessSync(statName);
  } catch(e) {
    console.log(`No statistic for month ${month} for package "${name}".`);
    return;
  }

  const shots = readJSON(statName).shots;

  console.log(util.inspect(shots.slice(num)));

};


/**
 * Show fields of last snapshots of all packages.
 * @param {string[]} args
 * @param {Object} config
 */
COMMANDS[LAST] = (args, config) => {

  if (args.length === 0) {
    args[0] = `day`;
  }

  const packages = getActivePackages(config);

  if (packages.length === 0) {
    console.log(`${NO_PACKAGES} (${config.packages}).`);
    return;
  }

  let last = ``;

  for (const pack of packages) {

    const name = pack.name,
          file = `${STATS}${name}/${getStatName()}.json`;

    try {
      fs.accessSync(file);
    } catch(e) {
      console.log(`No statistic for current month for package "${name}".`);
      continue;
    }

    const shot = readJSON(file).shots.slice(-1)[0];

    last += `${name}:`;
    for (const field of args) {
      last += ` ` + shot[field];
    }
    last += `\n`;

  }
  console.log(last.slice(0, -1));
};

/**
 * Show commands help.
 */
COMMANDS[HELP] = () => {
  console.log(
`npm-statistic get npm statistics for chosen packages and save to JSON.
Commands:
  add package-name            add package to config for regular getting stats
  update                      update statistics for all packages from config
  get                         get full config (as JSON object)
  get foo                     get foo field of config (as JSON object)
  get foo.bar                 get foo.bar field of config (as JSON object)
  set foo value               set string value of foo field of config
  set foo.bar {a: 2}          set JSON value of foo.bar field of config
  show pack-name              show stat of package for current month (if it is)
  show pack-name 10.2016      show stat of package for 10.2016 (if it is)
  show -5 pack-name           show last 5 stat shots for current month
  show -1 pack-name 10.2016   show last stat shots for 10.2016
  last                        show downloads in the last day for all packages
  last week                   show downloads in the last week for all packages
  last version day            show version and downloads in the last day
  help                        show this commands help
update is a default command.`
  );
};

/**
 * Update statistics for all packages from config.
 * @param {string[]} args
 * @param {Object} config
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
COMMANDS[UPDATE] = (args, config, ctx) => {

  const packages = getActivePackages(config);

  if (packages.length === 0) {
    console.log(`${NO_PACKAGES} (${config.packages}).`);
    return;
  }

  const retryTimeout = Number(config.retry) || RETRY_TIMEOUT,
        maxOpen = Number(config.open) || MAX_OPENED_REQUESTS;

  for (const pack of packages) {

    let count = 8 + Math.round((DEFAULT_TIMEOUT / RETRY_TIMEOUT) *
        (packages.length / MAX_OPENED_REQUESTS));

    const retry = () => {
      if (ctx.open < maxOpen) {
        updatePackage(pack, config, ctx);
      } else {
        if (--count > 0) setTimeout(retry, retryTimeout);
      }
    };

    retry();
  }

};

/**
 * Update statistic of package by name.
 * @param {Object} pack Package object.
 * @param {Object} config
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
const updatePackage = (pack, config, ctx) => {

  const name = pack.name,
        timeout = Number(config.timeout) || DEFAULT_TIMEOUT,
        req = https
          .get(
            `https://www.npmjs.com/package/${name}`,
            res => getCallback(res, ctx)
          );

  if (!hasOwn.call(ctx.attempts, name)) {
    ctx.attempts[name] = Number(config.attempts) || DEFAULT_ATTEMPTS;
  }

  ++ctx.open;

  let aborted = false;

  req.on(`error`, error => {
        if (!aborted) log(error);
      })
     .on(`abort`  , () => --ctx.open)
     .on(`aborted`, () => --ctx.open)
     .setTimeout(timeout, () => {
        aborted = true;
        req.abort();

        const message =
          `Request to "${name}" aborted by timeout ` +
          `(${timeout} ms); ${getCtxInfo(ctx)}.` +
          (ctx.attempts[name]-- > 0 ?
            `\nNew attempt (${ctx.attempts[name]} left).\n` :
            `\nNo attempts left, so skip package "${name}".\n`);

        if (ctx.attempts[name] >= 0) {
          console.log(message);
          updatePackage(pack, config, ctx);
        } else {
          log(message);
        }
     });
};

/**
 * Get context description.
 * @param  {Object} ctx Current context.
 * @return {string} Description string.
 */
const getCtxInfo = ctx => `open ${ctx.open}, left ${ctx.left}`;

/**
 * Callback for getting update response.
 * @param {http.IncomingMessage} res
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
const getCallback = (res, ctx) => {
  res.setEncoding('utf8')
     .on(`error`, log);

  let source = '';

  res.on(`data`, data => source += data)
     .on(`end`, () => {
        --ctx.open;
        updateCallback(source, res.statusCode, ctx);
     });
};

/**
 * Get spent time (from run command) in seconds.
 * @param {number} start Start time in ms.
 * @return {string}
 */
const getSpentTime = start => ((Date.now() - start)/1000).toFixed(3);

/**
 * Callback for getting response data.
 * @param {string} source
 * @param {number} status
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
const updateCallback = (source, status, ctx) => {

  --ctx.left;
  const shot = parseRes(source, status);

  if (shot.name) {
    console.log(
      `Update "${shot.name}" (${getSpentTime(ctx.start)}` +
      ` sec, ${getCtxInfo(ctx)}).`
    );
  } else {
    shot.name = NO_NAME;
  }

  const dir = `${STATS}${shot.name}/`,
        statName = `${dir}${getStatName()}.json`;

  try {
    fs.accessSync(dir);
  } catch(e) {
    fs.mkdirSync(dir);
  }

  try {
    fs.accessSync(statName);
  } catch(e) {
    writeJSON(statName, { shots: [] });
  }

  const stat = readJSON(statName),
        shots = stat.shots,
        len = shots.length,
        last = shots[len - 1],
        preLast = shots[len - 2];

  if (jsonsAreEqual(shot, last, `date`) &&
      jsonsAreEqual(shot, preLast, `date`)) {
    last.date = util.inspect(new Date());
  } else {
    shots.push(shot);
  }

  writeJSON(statName, stat);

};

/**
 * Compare of flat jsons.
 * @param  {*} a
 * @param  {*} b
 * @param  {string} skip Skip keys with this name.
 * @return {boolean} true, if a and has same key-value pairs.
 */
const jsonsAreEqual = (a, b, skip) => {

  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (!a || !b) return false;

  const keys = Object.keys(a).concat(Object.keys(b));

  for (const key of keys) {
    if (key !== skip && a[key] !== b[key]) return false;
  }

  return true;
};

/**
 * Parse update response source to package statistic shot object.
 * @param {string} source
 * @param {number} status
 * @return {Object} Parse package statistic shot object.
 */
const parseRes = (source, status) => {

  const shot = {
    date: util.inspect(new Date()),
    httpStatus: status
  };

  const packName = source.match(
          /\/package\/.+"/
        ),
        packVer = source.match(
  /<strong>(\d.*?)<\/strong>[^\d]*is the latest[^\d]+(\d*)[^\d]+release/
        ),
        packDeps = source.match(
          /<h3>Dependencies\s*\(?(\d*)\)?<\/h3>/
        ),
        packPub = source.match(
  /last-publisher[\s\S]+?<span>(.+?)<\/span>[\s\S]+?data-date="([^"]+)"/
        );

  if (!packName || !packName[0]) {
    log(shot.error = `${CANT} name.`);
    return shot;
  }

  shot.name = packName[0].slice(9, -1);

  if (!packVer || packVer.length !== 3) {
    log(`${CANT} version.`);
  } else {
    shot.version = packVer[1];
    shot.release = parseInt(packVer[2]) || 1;
  }

  if (!packDeps || packDeps.length !== 2) {
    log(`${CANT} deps.`);
  } else {
    shot.dependencies = parseInt(packDeps[1]) || 0;
  }

  if (!packPub || packPub.length !== 3) {
    log(`${CANT} publisher.`);
  } else {
    shot.publisher = packPub[1];
    shot.publishDate = packPub[2];
  }

  for (const item of PERIODS) {
    const res = source.match(item.reg);
    if (!res || res.length !== 2) {
      log(`${CANT} ${item.period} stat.`);
    } else {
      shot[item.period] = parseInt(res[1]) || 0;
    }
  }

  return shot;
};

/**
 * If called from command line, execute with it args.
 */
if (require.main && require.main.id === module.id) {
  npmStatistic(process.argv.slice(2));
}