/**
 * Created by kras on 13.07.16.
 */
var worker = require('lib/export');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

var dst = '../out';
var version = '';
var ns = '';

var setDst = false;
var setVer = false;
var setNamespace = false;

process.argv.forEach(function (val) {
  if (val === '--dst') {
    setDst = true;
    setVer = false;
    setNamespace = false;
    return;
  } else if (val === '--ns') {
    setDst = false;
    setVer = false;
    setNamespace = true;
    return;
  } else if (val === '--ver') {
    setDst = false;
    setVer = true;
    setNamespace = false;
    return;
  } else if (setDst) {
    dst = val;
  } else if (setVer) {
    version = val;
  } else if (setNamespace) {
    ns = val;
  }
  setDst = false;
  setVer = false;
  setNamespace = false;
});

// Связываем приложение
di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(
  // Импорт
  function (scope) {
  return worker(
    dst,
    scope.metaRepo,
    scope.dataRepo,
    {
      namespace: ns,
      version: version
    });
}).then(function () {
  console.info('Экспорт выполнен успешно.');
  process.exit(0);
}).catch(function (err) {
  console.error(err);
  process.exit(130);
});
