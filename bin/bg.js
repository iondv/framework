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
const extend = require('extend');
const path = require('path');
errorSetup(config.lang || 'ru');

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

di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents'])
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
      throw new Error('Working component of the background procedure was not found ' + params.task);
    }
    if (typeof worker !== 'function' && typeof worker.run !== 'function') {
      throw new Error('The working component of the background procedure ' + params.task + ' does not have a start method');
    }
    sysLog.info(new Date().toISOString() + ': Start the background routine ' + params.task);
    return typeof worker === 'function' ? worker(params) : worker.run(params);
  })
  .then((result) => {
    if (typeof process.send === 'function') {
      process.send(result);
    }
    sysLog.info(new Date().toISOString() + ': Background procedure ' + params.task + ' done');
    process.exit(0);
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });