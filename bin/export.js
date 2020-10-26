'use strict';
/* eslint no-process-exit:off */
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
const i18n = require('core/i18n');
const lang = config.lang || 'en';
const t = msg => i18n.t(msg)({lang, domain: 'export'});

errorSetup();

var sysLog = new IonLogger({});

var params = {
  dst: '../out',
  ver: null,
  ns: '',
  skipData: false,
  skipFiles: false,
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
  } else if (val === '--nodata') {
    params.skipData = true;
  } else if (val === '--nofiles') {
    params.skipFiles = true;
  } else if (val.substr(0, 2) === '--') {
    setParam = val.substr(2);
  } else if (setParam) {
    params[setParam] = val;
  }
});

// Application binding
di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents'])
  .then(scope =>
    di(
      'app',
      di.extract(
        ['metaRepo', 'dataRepo', 'workflows', 'sequenceProvider', 'accounts', 'roleAccessManager'],
        extend(true, config.di, scope.settings.get('plugins') || {})
      ),
      {},
      'boot',
      ['auth', 'application']
    )
  )
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then(scope =>
    worker(
      params.dst,
      {
        metaRepo: scope.metaRepo,
        dataRepo: scope.dataRepo,
        workflows: scope.workflows,
        sequences: scope.sequenceProvider,
        accounts: scope.accounts,
        accessManager: scope.roleAccessManager,
        log: scope.sysLog,
        namespace: params.ns,
        version: params.ver !== '-last' ? params.ver : null,
        skipData: params.skipData,
        skipFiles: params.skipFiles,
        exportAcl: params.exportAcl,
        fileDir: params.fileDir,
        lastVersion: params.ver === '-last'
      }).then(() => scope)
  )
  .then(scope => scope.dataSources.disconnect())
  .then(() => {
    console.info(t('Export successfully done.'), params.dst);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
