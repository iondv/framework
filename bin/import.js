'use strict';
/* eslint no-process-exit:off, no-sync:off */
/**
 * Created by kras on 10.07.16.
 */
const metaImporter = require('lib/import-meta');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const path = require('path');
const extend = require('extend');
const i18n = require('core/i18n');
i18n.default(config.lang);
const t = msg => i18n.t(msg)({domain: 'import'});
errorSetup();

var sysLog = new IonLogger(config.log || {});

var params = {
  src: '../in',
  ns: null
};

let setParam = null;

process.argv.forEach(function (val) {
  if (val.substr(0, 2) === '--') {
    setParam = val.substr(2);
  } else if (setParam) {
      params[setParam] = val;
  }
});

i18n.load(path.normalize(path.join(__dirname, '..', 'i18n')))
  .then(di('boot', config.bootstrap,
    {
      sysLog: sysLog
    }, null, ['rtEvents'])
  )
  .then(scope =>
    di(
      'app',
      di.extract(
        ['dbSync', 'metaRepo', 'dataRepo', 'workflows', 'sequenceProvider'],
        extend(true, config.di, scope.settings.get('plugins') || {})
      ),
      {},
      'boot',
      ['auth', 'application']
    )
  )
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then(scope =>
    metaImporter(params.src,
      {
        sync: scope.dbSync,
        metaRepo: scope.metaRepo,
        log: sysLog,
        namespace: params.ns
      }).then(() => scope)
  )
  .then(scope => scope.dataSources.disconnect())
  .then(() => {
    console.info(t('Model import successfully done'));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
