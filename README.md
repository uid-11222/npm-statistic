# npm-statistic #

  [![NPM version][npm-image]][npm-url] ![node][node-image] ![dependencies][dependencies-image] [![License MIT][license-image]](LICENSE)

  **npm-statistic** get npm stats for chosen packages and save to JSON. It's a console command for regularly invoke (by cron, for example).

## Usage ##
You need a node version >=6.0.0. Install npm-statistic localy or global, then run command without arguments for saving current stats:
```bash
$ npm-statistic
```

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