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

di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler', 'scheduler', 'background', 'application'])
  .then(scope => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot', ['background', 'application']))
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then(() => di(moduleName, extendDi(moduleName, context), {}, 'app', ['background'], params.path))
  .then((scope) => {
    let worker = scope[params.task];
    if (!worker) {
      throw new Error('Не найден рабочий компонент фоновой процедуры ' + params.task);
    }
    if (typeof worker !== 'function' && typeof worker.run !== 'function') {
      throw new Error('Рабочий компонент фоновой процедуры ' + params.task + ' не имеет метода запуска');
    }
    sysLog.info(new Date().toISOString() + ': Начало выполнения фоновой процедуры ' + params.task);
    return typeof worker === 'function' ? worker(params) : worker.run(params);
  })
  .then((result) => {
    if (typeof process.send === 'function') {
      process.send(result);
    }
    sysLog.info(new Date().toISOString() + ': Фоновая процедура ' + params.task + ' выполнена');
    process.exit(0);
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });