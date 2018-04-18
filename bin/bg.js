'use strict';
/**
 * Created by krasilneg on 19.07.17.
 */
const config = require('../config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
errorSetup(config.lang || 'ru');

let params = {};

var setParam = false;

// jshint maxstatements: 40, maxcomplexity: 20

process.argv.forEach(function (val) {
  if (val[0] === '-') {
    setParam = val.substr(1);
  } else if (setParam) {
    params[setParam] = val;
  }
});

let context = {};
if (params.config) {
  context = require(params.config).di;
}

di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler', 'scheduler'])
  .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}, context || {}), {}, 'boot', ['auth']))
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
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
  .then((result)=> {
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