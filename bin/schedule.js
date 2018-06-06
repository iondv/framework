'use strict';
/* eslint no-process-exit:off */
/**
 * Created by krasilneg on 19.07.17.
 */
const config = require('../config');
const di = require('core/di');
const alias = require('core/scope-alias');
const extend = require('extend');
const IonLogger = require('core/impl/log/IonLogger');
const Scheduler = require('core/impl/Scheduler');

const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
errorSetup(config.lang || 'ru');


// jshint maxcomplexity: 20, maxstatements: 30

di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler', 'application'])
  .then(scope => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot', ['auth', 'application']))
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then(
    /**
     * @param {{}} scope
     * @param {SettingsRepository} [scope.settings]
     * @returns {Promise}
     */
    (scope) => {
      scope.scheduler = new Scheduler({settings: scope.settings});
      return scope.scheduler.start();
    }
  )
  .then(() => {
    sysLog.info('Задания запущены');
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });