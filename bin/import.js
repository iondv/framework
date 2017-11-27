/**
 * Created by kras on 10.07.16.
 */
const worker = require('lib/import');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
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

// Связываем приложение
di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler'])
  .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot', ['auth']))
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
  .then((scope) =>
    worker(params.src, scope.dbSync, scope.metaRepo, scope.dataRepo, sysLog,
      {
        namespace: params.ns,
        ignoreIntegrityCheck: params.ignoreIntegrityCheck
      }).then(()=>scope)
  )
  .then((scope) => scope.dataSources.disconnect())
  .then(() => {
    console.info('Импорт выполнен успешно.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
