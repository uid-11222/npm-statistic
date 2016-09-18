# npm-statistic #

[![NPM version][npm-image]][npm-url] ![node][node-image] ![dependencies][dependencies-image] [![License MIT][license-image]](LICENSE)

[![NPM](https://nodei.co/npm/npm-statistic.png)](https://nodei.co/npm/npm-statistic/)

**npm-statistic** get npm stats for chosen packages and save to JSON. It's a console command for regularly invoke (by cron, for example).

## Usage ##
You need a node version >=6.0.0. Install npm-statistic localy or global, then add some packages to config, and run update command for saving current packages stats (config.json and stats/package-name/09.2016.json created automatically in npm-statistic dir).

## Commands ##

### add ###
Add package (by package name) to config for regular updating his statistics:
```bash
$ npm-statistic add package-name
```

### update ###
Default command. Update statistics for all packages from config. No arguments:
```bash
$ npm-statistic update
```
or 
```bash
$ npm-statistic
```

### get ###
Get config (as JSON object) or his parts.  
Get full config:
```bash
$ npm-statistic get
```
Get foo field of config (as JSON object):
```bash
$ npm-statistic get foo
```
Get foo.bar field of config (as JSON object):
```bash
$ npm-statistic get foo.bar
```
For example, field "packages" contain array of all config packages:
```bash
$ npm-statistic get packages
```
First package:
```bash
$ npm-statistic get packages.0
```

### set ###
Set config parts (as JSON object). Additional fields in the config file can be used to extend the functionality.  
Set string value of foo field of config:
```bash
$ npm-statistic set foo value
```
Set JSON value of foo.bar field of config:
```bash
$ npm-statistic set foo.bar {a: 2}
```
For example, field "timeout" contain response timeout in milliseconds (default timeout is 16382):
```bash
$ npm-statistic set timeout 4000
```
Now timeout is 4 seconds.

For deleting, for example, package #2 from config you can set it to null:
```bash
$ npm-statistic set packages.2 null
```
For temporary skipping package in statistic update you can set package field "skip" to true:
```bash
$ npm-statistic set packages.3.skip true
```
Now package statistics do not updated.
```bash
$ npm-statistic set packages.3.skip false
```
Package statistics updated again.

For deleting last added package you can shorten the length of list of packages per one:
```bash
$ npm-statistic get packages.length
14
$ npm-statistic set packages.length 13
```

### show ###
Show raw saved month statistics of package by package name.  
Show full statistics of package for current month (if it is):
```bash
$ npm-statistic show package-name
```

Show full statistics of package for custom month (if it is):
```bash
$ npm-statistic show package-name 10.2016
```

Show last four statistic snapshots for custom month (if it is):
```bash
$ npm-statistic show -4 package-name 10.2016
```

Show last statistic snapshots for current month (if it is):
```bash
$ npm-statistic show -1 package-name
```


### help ###
Show short help.

## Details ##
**Important**: if you update (reinstall) npm-statistic, config and accumulated statistics disappear (as they are stored in the installation directory). You can save config.json and stats/ in other dir before update, and move them to npm-statistic dir after update.

Example of one package statistic snapshot:
```js
{ date: 1474151029433,
  status: 200,
  name: 'react',
  version: '15.3.1',
  release: 88,
  deps: 3,
  publisher: 'zpao',
  pubDate: '2016-08-19T18:50:25.665Z',
  day: 80366,
  week: 469720,
  month: 2056691 }
```
 - **date**: UTC date of snapshot
 - **status**: HTTP status code of response
 - **name**: package name
 - **version**: current version of package
 - **release**: number of release
 - **deps**: number of package dependencies
 - **publisher**: package publisher (name of NPM user)
 - **pubDate**: date of publishing
 - **day**: number of downloads in the last day
 - **week**: number of downloads in the last week
 - **month**: number of downloads in the last month

npm-statistic does all file system operations in synchronous mode (but statistics https-requests are asynchronous, of course).

All errors are written to logs.txt in npm-statistic dir.

You can run npm-statistic with any frequency, because if the package has not changed statistics, new records in the file does not occur (changes only the timestamp of the last update statistics). Therefore, the statistics file size is always limited by the number of changes in the statistics on package npm-page.

If you add nonexistent package to config, npm-statistic saves "stats" for this package, but with response status 404 (it is convenient to store the statuses 500, 503 and so on, when www.npmjs.com works with problems).

## Tests ##
```bash
$ npm install
$ npm test
```

## License ##
  [MIT](LICENSE)

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg "license-image"
[dependencies-image]: https://img.shields.io/gemnasium/mathiasbynens/he.svg?maxAge=2592000 "dependencies-image"
[node-image]: https://img.shields.io/badge/node-v6.0.0-brightgreen.svg?maxAge=2592000 "node-image"
[npm-image]: https://img.shields.io/npm/v/npm-statistic.svg "npm-image"
[npm-url]: https://www.npmjs.com/package/npm-statistic "npm-statistic"