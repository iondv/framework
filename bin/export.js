'use strict';
/**
 * Created by kras on 13.07.16.
 */
const worker = require('lib/export');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
errorSetup(config.lang || 'ru');

var sysLog = new IonLogger({});

var params = {
  dst: '../out',
  ver: null,
  ns: '',
  skipData: false,
  fileDir: false
};

var setParam = false;

// jshint maxstatements

process.argv.forEach(function (val) {
  if (val === '--file-dir') {
    setParam = 'fileDir';
  } else if (val === '--acl') {
    params.exportAcl = 'json';
    setParam = 'exportAcl';
  } else if (val.substr(0, 2) === '--') {
    setParam = val.substr(2);
  } else if (val === '--nodata') {
    params.skipData = true;
  } else if (setParam) {
    params[setParam] = val;
  }
});

// Связываем приложение
di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler'])
  .then((scope) =>
    di(
      'app',
      extend(true, config.di, scope.settings.get('plugins') || {}),
      {}, 'boot',
      ['auth', 'aclProvider', 'roleAccessManager']
    )
  )
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
  .then((scope) =>
    worker(
      params.dst,
      {
        metaRepo: scope.metaRepo,
        dataRepo: scope.dataRepo,
        workflows: scope.workflows,
        auth: scope.workflows,
        accessManager: scope.roleAccessManager,
        namespace: params.ns,
        version: params.ver !== '-last' ? params.ver : null,
        skipData: params.skipData,
        exportAcl: params.exportAcl,
        fileDir: params.fileDir,
        lastVersion: params.ver === '-last'
      }).then(()=>scope)
  )
  .then((scope) => scope.dataSources.disconnect())
  .then(() => {
    console.info('Экспорт выполнен успешно.', params.dst);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
