#!/usr/bin/env node

'use strict'; /* globals process */

const fs = require('fs'),
      https = require('https'),
      util = require('util');

const UPDATE = `update`, SET = `set`, GET = `get`;

const TIMEOUT = 8192;

const CONFIG = `config.json`, STATS = `./stats/`;

const COMMANDS = {};

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
    console.log(`Cannot find config ("${CONFIG}"). Create new empty config.`);
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

  COMMANDS[command](args, config);
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
 * @return {?Object} Parsed JSON value (null if no such file).
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
}

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
 * Update statistics for packages from config.
 * @param {string[]} args
 * @param {Object} config
 */
COMMANDS[UPDATE] = (args, config) => {

  const packages = config.packages || [],
        names = packages.map(pack => pack.name);

  for (const name of names) {
    updatePackage(name);
  }

};

/**
 * Errors logger.
 * @param {Error} error
 */
const logError = error => {
  console.log(`Got error: ${error.message}`);
};

const timeOut = () => {
  console.log(`Request close, timeout (${TIMEOUT} ms).`);
};

/**
 * Update statistic of package by name.
 * @param {string} name Package name.
 */
const updatePackage = name => {

  https.get(`https://www.npmjs.com/package/${name}`, getCallback)
       .on(`error`, logError)
       .setTimeout(TIMEOUT, timeOut);

};

/**
 * Callback for getting update response.
 * @param {ServerResponse} res
 */
const getCallback = res => {
  res.setEncoding('utf8')
     .on(`error`, logError);

  let source = '';

  res.on(`data`, data => source += data)
     .on(`end`, () => {
        updateCallback(source, res.statusCode);
     });
};

/**
 * Callback for getting response data.
 * @param {string} source
 * @param {number} status
 */
const updateCallback = (source, status) => {

  const pack = parseRes(source, status),
        dir = STATS + pack.name + '/',
        statName = dir + getStatName();

  try {
    fs.accessSync(dir);
  } catch(e) {
    fs.mkdirSync(dir);
  }

  try {
    fs.accessSync(statName);
  } catch(e) {
    writeJSON(statName, {packages: []});
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

  const packName = source.match(/\/package\/.+"/);

  if (!packName || !packName[0]) {
    logError(pack.error = `Cannot find name.`);
    return pack;
  }

  pack.name = packName[0].slice(9, -1);

  console.log(`Update "${pack.name}" statistic.`);

  return pack;
};

const getStatName = () => {

  const now = new Date(),
        year = now.getFullYear();

  let month = now.getMonth() + 1;
  if (month < 10) month = '0' + month;

  return `${month}.${year}.json`;
};

/**
 * If called from command line, execute with it args.
 */
if (require.main && require.main.id === module.id) {
  npmStatistic(process.argv.slice(2));
}