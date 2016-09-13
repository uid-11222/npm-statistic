#!/usr/bin/env node

'use strict'; /* globals process */

const fs = require('fs');

module.exports = fullGitHistory;

/**
 * If called from command line, execute with it args.
 */
if (require.main && require.main.id === module.id) {
  fullGitHistory(process.argv.slice(2));
}