#!/usr/bin/env node

'use strict'; /* globals process */

const fs = require('fs'),
      http = require('http');

const UPDATE = `update`, SET = `set`, GET = `get`;

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

  console.log(JSON.stringify(getJsonPart(config, keys)));

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
 * If called from command line, execute with it args.
 */
if (require.main && require.main.id === module.id) {
  npmStatistic(process.argv.slice(2));
}