/**
 * Created by kras on 13.07.16.
 */
var worker = require('lib/export');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

var params = {
  dst: '../out',
  ver: '',
  ns: '',
  skipData: false,
  fileDir: false
};

var setParam = false;

// jshint maxstatements

process.argv.forEach(function (val) {
  if (val === '--file-dir') {
    setParam = 'fileDir';
  } else if (val.substr(0, 2) === '--') {
    setParam = val.substr(2);
  } else if (val === '--nodata') {
    params.skipData = true;
  } else if (setParam) {
    params[setParam] = val;
  }
});

var scope = null;
// Связываем приложение
di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(
  // Импорт
  function (scp) {
    scope = scp;
    return worker(
      params.dst,
      scope.metaRepo,
      scope.dataRepo,
      {
        namespace: params.ns,
        version: params.version,
        skipData: params.skipData,
        fileDir: params.fileDir
      });
  }
).then(
  function () {
    return scope.dataSources.disconnect();
  }
).then(function () {
  console.info('Экспорт выполнен успешно.', params.dst);
  process.exit(0);
}).catch(function (err) {
  console.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});
