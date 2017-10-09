/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');

/**
 * @param {{}} options
 * @param {Boolean} options.enabled
 * @param {SettingsRepository} options.settings
 * @param {Logger} [options.log]
 * @param {Number} [options.stopTimeout]
 * @constructor
 */
function Scheduler(options) {
  let running = {};

  function stopper(nm, ch) {
    return new Promise((resolve, reject) => {
      try {
        let to = setTimeout(
          () => {
            if (options.log) {
              options.log.warn(`Не удалось завершить задание ${nm} в отведенное время`);
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
    for (let nm in running) {
      if (running.hasOwnProperty(nm)) {
        result.push(stopper(nm, running[nm]));
      }
    }
    return Promise.all(result).then(()=> {running = {};});
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.run = function (job) {
    try {
      if (!running.hasOwnProperty(job)) {
        let jobs = options.settings.get('jobs');
        if (!jobs.hasOwnProperty(job)) {
          throw new Error(`Задание ${job} не найдено в конфигурации`);
        }
        running[job] = child.fork('bin/job-runner', [job], {stdio: ['pipe','inherit','inherit','ipc']});
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
  this.isRunning = function (job) {
    let jobs = options.settings.get('jobs');
    if (!jobs.hasOwnProperty(job)) {
      throw new Error(`Задание ${job} не найдено в конфигурации`);
    }
    return running.hasOwnProperty(job);
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.stop = function (job) {
    if (running.hasOwnProperty(job)) {
      return stopper(job, running[job]).then(() => delete running[job]);
    }
    return Promise.resolve();
  };

  /**
   * @returns {Promise}
   */
  this.start = function () {
    try {
      let jobs = options.settings.get('jobs');
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && !jobs[nm].disabled) {
          running[nm] = child.fork('bin/job-runner', [nm], {stdio: ['pipe','inherit','inherit','ipc']});
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
    return this.stopAll().then(()=> {
      return this.start();
    });
  };

  /**
   * @returns {Array}
   */
  this.getJobs = function () {
    let jobs = options.settings.get('jobs');
    for (let job in jobs) {
      if (jobs.hasOwnProperty(job)) {
        jobs[job].isRunning = this.isRunning(job);
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
    result.isRunning = this.isRunning(job);
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
      throw new Error(`Переданы некорректные параметры задания.`);
    }
    jobs[jobName] = jobSettings;
    options.settings.set('jobs', jobs);
    return options.settings.apply();
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.removeJob = function (job) {
    try {
      let promise = Promise.resolve();
      if (this.isRunning(job)) {
        promise = this.stop(job);
      }
      return promise.then(()=> {
        let jobs = options.settings.get('jobs');
        if (jobs.hasOwnProperty(job)) {
          delete jobs[job];
          options.settings.set('jobs', jobs);
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
