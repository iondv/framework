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

let jobName = false;

if (process.argv.length > 2) {
  jobName = process.argv[2];
} else {
  console.error('Не передано имя задания');
  process.exit(130);
}

let job = false;

di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler', 'scheduler'])
  .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot', ['auth']))
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
  .then(
    /**
     * @param {{}} scope
     * @param {SettingsRepository} [scope.settings]
     * @returns {Promise}
     */
    (scope) => {
      let jobs = scope.settings.get('jobs') || {};
      if (
        jobs.hasOwnProperty(jobName) &&
        jobs[jobName] &&
        typeof jobs[jobName] === 'object'
      ) {
        job = jobs[jobName];
        if (!job.worker) {
          throw new Error('Не указан рабочий компонент задания ' + jobName);
        }
        return di('job', jobs[jobName].di || {}, {}, 'app')
          .then((scope) => {return scope;});
      } else {
        throw new Error('Задание ' + jobName + ' не найдено');
      }
    })
  .then((scope) => {
    let worker = scope[job.worker];
    if (!worker) {
      throw new Error('Не найден рабочий компонент задания ' + jobName);
    }
    if (typeof worker !== 'function' && typeof worker.run !== 'function') {
      throw new Error('Рабочий компонент задания ' + jobName + ' не имеет метода запуска');
    }
    sysLog.info(new Date().toISOString() + ': Начало выполнения задания ' + jobName);
    return typeof worker === 'function' ? worker() : worker.run();
  })
  .then(()=>{
    sysLog.info(new Date().toISOString() + ': Задание ' + jobName + ' выполнено');
    process.exit(0);
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });