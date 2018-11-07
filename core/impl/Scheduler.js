'use strict';
/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');
const toAbsolutePath = require('core/system').toAbsolute;

/**
 * @param {{}} options
 * @param {Boolean} options.enabled
 * @param {SettingsRepository} options.settings
 * @param {Logger} [options.log]
 * @param {Number} [options.stopTimeout]
 * @constructor
 */
function Scheduler(options) {

  const runningModes = {
    STOPPED: 0,
    RUNNED: 1,
    MANUALLY: 2
  };

  this.RunningModes = function () {
    return runningModes;
  }

  let runned = {};
  let manually = {};

  function stopper(nm, ch) {
    return new Promise((resolve, reject) => {
      try {
        let to = setTimeout(
          () => {
            if (options.log) {
              options.log.warn(`Не удалось завершить задание ${nm} в отведенное время.`);
            }
            ch.removeAllListeners();
            resolve();
          },
          options.stopTimeout || 10000
        );
        ch.on('exit', () => {
          clearTimeout(to);
          resolve();
        });
        ch.on('error', (err) => {
          clearTimeout(to);
          reject(err);
        });
        ch.kill('SIGKILL');
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @returns {Promise}
   */
  this.stopAll = function () {
    let result = [];
    for (let nm in runned) {
      if (runned.hasOwnProperty(nm)) {
        result.push(stopper(nm, runned[nm]));
      }
    }
    return Promise.all(result).then(() => {
      runned = {};
    });
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.run = function (job) {
    try {
      if (manually.hasOwnProperty(job)) {
        throw new Error(`Задание ${job} уже запущено вручную.`);
      }
      if (!runned.hasOwnProperty(job)) {
        let jobs = options.settings.get('jobs');
        if (!jobs.hasOwnProperty(job)) {
          throw new Error(`Задание ${job} не найдено в конфигурации.`);
        }
        runned[job] = child.fork(toAbsolutePath('bin/job-runner'), [job], {stdio: ['pipe','inherit','inherit','ipc']});
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @param {String} job
   * @returns {Boolean}
   */
  this.RunningMode = function (job) {
    if (runned.hasOwnProperty(job)) {
      return runningModes.RUNNED;
    } else if (manually.hasOwnProperty(job)) {
      return runningModes.MANUALLY;
    } else {
      return runningModes.STOPPED;
    }
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.stop = function (job) {
    if (manually.hasOwnProperty(job)) {
      return Promise.reject(new Error(`Задание ${job} запущено вручную и не может быть прервано.`));
    }
    if (runned.hasOwnProperty(job)) {
      return stopper(job, runned[job]).then(() => delete runned[job]);
    }
    return Promise.resolve();
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.manualStart = function (job) {
    try {
      if (runned.hasOwnProperty(job)) {
        throw new Error(`Задание ${job} уже запущено по расписанию.`);
      }
      if (!manually.hasOwnProperty(job)) {
        let jobs = options.settings.get('jobs');
        if (!jobs.hasOwnProperty(job)) {
          throw new Error(`Задание ${job} не найдено в конфигурации`);
        }
        manually[job] = child.fork(toAbsolutePath('bin/job'), [job], {stdio: ['pipe','inherit','inherit','ipc']});
        manually[job].on('exit', () => {
          delete manually[job];
        });
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @returns {Promise}
   */
  this.start = function () {
    try {
      let jobs = options.settings.get('jobs');
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && !manually.hasOwnProperty(nm) && !jobs[nm].disabled) {
          runned[nm] = child.fork(toAbsolutePath('bin/job-runner'), [nm], {stdio: ['pipe','inherit','inherit','ipc']});
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @returns {Promise}
   */
  this.restart = function () {
    return this.stopAll().then(() => this.start());
  };

  /**
   * @returns {Array}
   */
  this.getJobs = function () {
    let jobs = options.settings.get('jobs');
    for (let job in jobs) {
      if (jobs.hasOwnProperty(job)) {
        jobs[job].runningMode = this.RunningMode(job);
      }
    }
    return jobs;
  };

  /**
   * @param {String} job
   * @returns {Object}
   */
  this.getJob = function (job) {
    let result = options.settings.get('jobs')[job];
    result.runningMode = this.RunningMode(job);
    return result;
  };

  /**
   * @param {String} jobName
   * @param {Object} jobSettings
   * @param {Object} jobSettings.launch
   * @param {String} jobSettings.worker
   * @param {Object} jobSettings.di
   * @returns {Promise}
   */
  this.saveJob = function (jobName, jobSettings) {
    let jobs = options.settings.get('jobs');
    if (!jobSettings || !jobSettings.launch || !jobSettings.worker || !jobSettings.di) {
      throw new Error('Переданы некорректные параметры задания.');
    }
    jobs[jobName] = jobSettings;
    options.settings.set('jobs', jobs, true);
    return options.settings.apply();
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.removeJob = function (job) {
    try {
      let promise = Promise.resolve();
      if (this.RunningMode(job) === runningModes.MANUALLY) {
        throw new Error(`Задание ${job} запущено вручную и не может быть удалено.`);
      }
      if (this.RunningMode(job) === runningModes.RUNNED) {
        promise = this.stop(job);
      }
      return promise.then(() => {
        let jobs = options.settings.get('jobs');
        if (jobs.hasOwnProperty(job)) {
          delete jobs[job];
          options.settings.set('jobs', jobs, true);
          return options.settings.apply();
        }
        return Promise.resolve();
      });
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

module.exports = Scheduler;
