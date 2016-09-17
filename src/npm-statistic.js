#!/usr/bin/env node

'use strict'; /* globals process */

const fs = require('fs'),
      https = require('https'),
      util = require('util');

const UPDATE = `update`, SET = `set`, GET = `get`,
      ADD = `add`, SHOW = `show`, HELP = `help`;

const DEFAULT_TIMEOUT = 16384;

const CONFIG = `config.json`, LOGS = `logs.txt`, STATS = `./stats/`;

const COMMANDS = {};

const PERIODS = [`day`, `week`, `month`].map(period => ({
        period, reg: RegExp(
          (period === 'day' ? 'dai' : period) +
          `ly-downloads[^\\d]+(\\d+)<\\/strong>`
        )
      }));

const CANT = `Cannot find`, NO_NAME = `no-name-packages`;

/**
 * Update stat, get/set config params.
 * @param {string[]} args 
 */
const npmStatistic = module.exports = args => {

  if (!args[0]) args[0] = UPDATE;

  const command = args.shift();

  try {
    fs.accessSync(CONFIG);
  } catch(e) {
    console.log(`${CANT} config ("${CONFIG}"). Create new empty config.`);
    writeJSON(CONFIG, {});
  }

  try {
    fs.accessSync(STATS);
  } catch(e) {
    fs.mkdirSync(STATS);
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
    left: Number(config.packages && config.packages.length)
  };

  COMMANDS[command](args, config, ctx);
};


/**
 * Errors logger.
 * @param {Error} error
 */
const logError = error => {

  const data = `Got error. ${error}`;
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
    console.log(`Not enough args.`);
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
  }

  obj[key] = value;
  writeJSON(CONFIG, config);
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

  const such = config.packages.filter(pack => pack.name === name);

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

  console.log(util.inspect(readJSON(statName)));

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
  show package-name           show stat of package for current month (if it is)
  show package-name 10.2016   show stat of package for 10.2016 (if it is)
  help                        show this commands help
update is a default command.`
  );
};

/**
 * Update statistics for packages from config.
 * @param {string[]} args
 * @param {Object} config
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
COMMANDS[UPDATE] = (args, config, ctx) => {

  const packages = config.packages;

  if (!packages || !packages.length) {
    console.log(`No packages (${packages}).`);
    return;
  }

  for (const pack of packages) {
    updatePackage(pack, config, ctx);
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

  req.on(`error`, logError)
     .setTimeout(timeout, () => {
       req.abort();
       logError(`Request to "${name}" aborted by timeout (${timeout} ms).`);
     });
};

/**
 * Callback for getting update response.
 * @param {http.IncomingMessage} res
 * @param {Object} ctx Context of concrete npmStatistic call.
 */
const getCallback = (res, ctx) => {
  res.setEncoding('utf8')
     .on(`error`, logError);

  let source = '';

  res.on(`data`, data => source += data)
     .on(`end`, () => {
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

  const pack = parseRes(source, status);

  if (pack.name) {
    console.log(
  `Update "${pack.name}" (${getSpentTime(ctx.start)} sec, ${--ctx.left} left).`
    );
  } else {
    pack.name = NO_NAME;
  }

  const dir = `${STATS}${pack.name}/`,
        statName = `${dir}${getStatName()}.json`;

  try {
    fs.accessSync(dir);
  } catch(e) {
    fs.mkdirSync(dir);
  }

  try {
    fs.accessSync(statName);
  } catch(e) {
    writeJSON(statName, { packages: [] });
  }

  const stat = readJSON(statName),
        packages = stat.packages,
        len = packages.length,
        last = packages[len - 1],
        preLast = packages[len - 2],
        curDate = Date.now();

  if (jsonsAreEqual(pack, last, `date`) &&
      jsonsAreEqual(pack, preLast, `date`)) {
    last.date = curDate;
  } else {
    packages.push(pack);
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
 * Parse update response source to package object.
 * @param {string} source
 * @param {number} status
 * @return {Object} Parsed package.
 */
const parseRes = (source, status) => {

  const pack = { date: Date.now(), status };

  const packName = source.match(
          /\/package\/.+"/
        ),
        packVer = source.match(
          /<strong>(\d.*?)<\/strong>[^\d]*is the latest[^\d]+(\d+)/
        ),
        packDeps = source.match(
          /<h3>Dependencies\s*\(?(\d*)\)?<\/h3>/
        ),
        packPub = source.match(
  /last-publisher[\s\S]+?<span>(.+?)<\/span>[\s\S]+?data-date="([^"]+)"/
        );

  if (!packName || !packName[0]) {
    logError(pack.error = `${CANT} name.`);
    return pack;
  }

  pack.name = packName[0].slice(9, -1);

  if (!packVer || packVer.length !== 3) {
    logError(`${CANT} version.`);
  } else {
    pack.version = packVer[1];
    pack.release = parseInt(packVer[2]);
  }

  if (!packDeps || packDeps.length !== 2) {
    logError(`${CANT} deps.`);
  } else {
    pack.deps = parseInt(packDeps[1] || 0);
  }

  if (!packPub || packPub.length !== 3) {
    logError(`${CANT} publisher.`);
  } else {
    pack.publisher = packPub[1];
    pack.pubDate = packPub[2];
  }

  for (const item of PERIODS) {
    const res = source.match(item.reg);
    if (!res || res.length !== 2) {
      logError(`${CANT} ${item.period} stat.`);
    } else {
      pack[item.period] = parseInt(res[1]);
    }
  }

  return pack;
};

/**
 * If called from command line, execute with it args.
 */
if (require.main && require.main.id === module.id) {
  npmStatistic(process.argv.slice(2));
}