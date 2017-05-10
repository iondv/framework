/**
 * Created by kras on 10.07.16.
 */
const worker = require('lib/import');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const errorSetup = require('core/error-setup');
errorSetup(config.lang || 'ru');

var sysLog = new IonLogger(config.log || {});

var params = {
  src: '../in',
  ns: null,
  ignoreIntegrityCheck: true
};

var setParam = false;

process.argv.forEach(function (val) {
  if (val.substr(0, 2) === '--') {
    setParam = val.substr(2);
  } else if (val === '--ignoreIntegrityCheck') {
    console.warn('При импорте игнорируется целостность данных, возможны ошибки в БД');
    params.ignoreIntegrityCheck = true;
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
    return worker(params.src, scope.dbSync, scope.metaRepo, scope.dataRepo, sysLog,
      {
        namespace: params.ns,
        ignoreIntegrityCheck: params.ignoreIntegrityCheck
      });
  }
).then(function () {
  return scope.dataSources.disconnect();
}).then(
  // Справились
  function () {
    console.info('Импорт выполнен успешно.');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});
