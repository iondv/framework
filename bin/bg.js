'use strict';
/* eslint no-process-exit:off */
/**
 * Created by krasilneg on 19.07.17.
 */
const config = require('../config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extendDi = require('core/extendModuleDi');
const {s} = require('core/strings');
const extend = require('extend');
const path = require('path');
const {format} = require('util');
const {t, lang, load} = require('core/i18n');

lang(config.lang);
errorSetup();

let params = {};

let setParam = false;

// jshint maxstatements: 40, maxcomplexity: 20

process.argv.forEach(function (val) {
  if (val[0] === '-') {
    setParam = val.substr(1);
  } else if (setParam) {
    params[setParam] = val;
  }
});

let context = {};
let moduleName = 'bg';
if (params.path) {
  context = require(path.join(params.path, 'config')).di;
  moduleName = path.basename(params.path);
}

load(path.normalize(path.join(__dirname, '..', 'i18n')), null, config.lang)
  .then(() => di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents']))
  .then(scope =>
    di(
      'app',
      di.extract(
        [params.task],
        extend(
          true,
          config.di,
          scope.settings.get('plugins') || {},
          extendDi(moduleName, context, scope)
        )
      ),
      {},
      'boot',
      ['background', 'sessionHandler', 'scheduler', 'application', 'module'],
      params.path
    )
  )
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then((scope) => {
    let worker = scope[params.task];
    if (!worker) {
      throw new Error(format(t('Worker component not found for background job %s'), params.task));
    }
    if (typeof worker !== 'function' && typeof worker.run !== 'function') {
      throw new Error(format(t('Worker component of background job %s has no launch method'), params.task));
    }
    sysLog.info(format(t('%s: Start of background job %s'), new Date().toISOString(), params.task));
    return typeof worker === 'function' ? worker(params) : worker.run(params);
  })
  .then((result) => {
    if (typeof process.send === 'function') {
      process.send(result);
    }
    sysLog.info(format(t('%s: Background job %s done'), new Date().toISOString(), params.task));
    process.exit(0);
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });