'use strict';
/**
 * Created by Данил on 17.02.2017.
 */

/* jshint maxstatements: 100, maxcomplexity: 100*/

var worker = require('lib/importAddressCatalog');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});
var scope = null;
var sourcePath = null;
var regionFilter = null;

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--sourcePath') {
    sourcePath = process.argv[i + 1];
  } else if (process.argv[i] === '--regionFilter') {
    regionFilter = process.argv[i + 1];
  }
}

di('app', config.di,
  {sysLog: sysLog},
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {
  scope = s;
  return worker.start(sourcePath, regionFilter, scope.dataRepo, sysLog);
}).then(function () {
  return scope.dataSources.disconnect();
}).then(function () {
  process.exit(0);
}).catch(function (err) {
  sysLog.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});
