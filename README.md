# npm-statistic #

[![NPM version][npm-image]][npm-url] ![node][node-image] ![dependencies][dependencies-image] [![License MIT][license-image]](LICENSE)

[![NPM](https://nodei.co/npm/npm-statistic.png)](https://nodei.co/npm/npm-statistic/)

**npm-statistic** get npm download stats for chosen packages and save it to JSON files.  
It's a console command for regularly invoke (by cron, for example).  
Package statistics taken from package's npm page.

## Usage ##
You need a node version >=6.0.0.  
Install **npm-statistic** localy or global, then **add** some packages to config, and run **update** command for saving current packages stats (config.json and files like stats/package-name/09.2016.json created automatically in **npm-statistic** dir):
```bash
$ npm-statistic add express
$ npm-statistic update
$ npm-statistic show express
```

You can use **npm-statistic** programmatically:
```js
const npmStatistic = require('npm-statistic');

/**
 * @param {string[]} Args list.
 */
npmStatistic([`add`, 'express']);
npmStatistic([`update`]); // or npmStatistic([]);
npmStatistic([`show`, 'express']);
```

## Commands ##

### add ###
Add package (by package name) to config for regular updating his statistics:
```bash
$ npm-statistic add package-name
```

For example, add [react](https://www.npmjs.com/package/react) package:
```bash
$ npm-statistic add react
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

Get *foo* field of config (as JSON object):
```bash
$ npm-statistic get foo
```

Get *foo.bar* field of config (as JSON object):
```bash
$ npm-statistic get foo.bar
```

For example, field **packages** contain array of all config packages:
```bash
$ npm-statistic get packages
```

First package:
```bash
$ npm-statistic get packages.0
```

Third package:
```bash
$ npm-statistic get packages.2
```

### set ###
Set config parts (as JSON object); "packages" array in config contains all packages for which stats should be updated. Additional fields in the config file can be used to extend the functionality.  
Set string value of *foo* field of config:
```bash
$ npm-statistic set foo value
```

Set JSON value of *foo.bar* field of config:
```bash
$ npm-statistic set foo.bar {a: 2}
```

For example, field **timeout** contain response timeout in milliseconds (if there is no such field, default timeout is 16 * 1024):
```bash
$ npm-statistic set timeout 4000
```
Now timeout is 4 seconds.

Field **open** contain maximum number of opened stats requests (if there is no such field, default value is 2). The higher the value, the faster will be updated packages statistics, but also the greater the likelihood of disconnection.
```bash
$ npm-statistic set open 4
```
Now **npm-statistic** will send four requests at a time.

Field **retry** contain timeout (in milliseconds) between attempts to send stat request (if there is no such field, default value is 512):
```bash
$ npm-statistic set retry 100
```
Now when you run **update** command each package will check for available connections ten times per second.

Field **attempts** contain number of stat requests attempts (each sended request is the one attempt). If there is no such field, default value is 4.
```bash
$ npm-statistic set attempts 2
```
Now if first request for some package will be aborted, **npm-statistic** send only one new request for this package.

For deleting, for example, third package from config you can set it to null:
```bash
$ npm-statistic set packages.2 null
```

For temporary skipping package in statistic update you can set package field **skip** to true:
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

### last ###
Show some fields of last statistic snapshots for all packages (**day** is the default field).  
A list of fields separated by spaces:
```bash
$ npm-statistic last version week
```
It displays a list of all config packages with the latest versions and the number of downloads in the last week.

```bash
$ npm-statistic last month
```
It displays a list of all config packages with the number of downloads in the last month.  
A list of all available fields is below.

### help ###
Show short help.

## Details ##
**Important**: if you update (reinstall) **npm-statistic**, config and accumulated statistics disappear (as they are stored in the installation directory). You can save config.json and stats/ in other dir before update, and move them to **npm-statistic** dir after update.

Example of one [package](https://www.npmjs.com/package/react) statistic snapshot:
```js
{ date: '2016-09-19T22:33:50.436Z',
  httpStatus: 200,
  name: 'react',
  version: '15.3.1',
  release: 88,
  dependencies: 3,
  publisher: 'zpao',
  publishDate: '2016-08-19T18:50:25.665Z',
  day: 80366,
  week: 469720,
  month: 2056691 }
```
 - **date**: date of snapshot
 - **httpStatus**: HTTP status code of response
 - **name**: package name
 - **version**: current version of package
 - **release**: number of releases
 - **dependencies**: number of package dependencies
 - **publisher**: package publisher (name of NPM user)
 - **publishDate**: date of publishing
 - **day**: number of downloads in the last day
 - **week**: number of downloads in the last week
 - **month**: number of downloads in the last month

**npm-statistic** does all file system operations in synchronous mode (but statistics https-requests are asynchronous, of course).

All errors are written to logs.txt in **npm-statistic** dir.

You can run **npm-statistic** with any frequency, because if the package has not changed statistics, new records in the file does not occur (changes only the timestamp of the last update statistics). Therefore, the statistics file size is always limited by the number of changes in the statistics on package npm-page.

If you add nonexistent package to config, **npm-statistic** saves "stats" for this package, but with response status 404 (it is convenient to store the statuses 500, 503 and so on, when www.npmjs.com works with problems).

## Tests ##
42 Mocha tests:
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