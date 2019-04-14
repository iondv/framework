const Scheduler = require('core/impl/Scheduler');

/**
 * Created by krasilneg on 08.11.18.
 */

/**
 * @param {{}} options
 * @param {Repository} options.repo
 * @param {SettingsRepository} options.settings
 * @constructor
 */
function SchedulerAgent(options) {

  this.statusCodes = function () {
    return Scheduler.statusCodes;
  };

  /**
   * @param {String} job
   * @returns {Promise<Boolean>}
   */
  this.status = function (job) {
    return options.repo.get(Scheduler.statusRepoKey).then((statuses) => {
      if (!job) {
        return statuses || {};
      }
      if (statuses && statuses.hasOwnProperty(job)) {
        return statuses[job];
      }
      return Scheduler.statusCodes.STOPPED;
    });
  };

  /**
   * @returns {Promise<Array>}
   */
  this.getJobs = function () {
    let jobs = options.settings.get('jobs');
    return options.repo.get(Scheduler.statusRepoKey).then((statuses) => {
      for (let job in jobs) {
        if (jobs.hasOwnProperty(job)) {
          jobs[job].status = statuses && statuses[job] || Scheduler.statusCodes.STOPPED;
        }
      }
      return jobs;
    });
  };

  /**
   * @param {String} job
   * @returns {Object}
   */
  this.getJob = function (job) {
    let result = options.settings.get('jobs')[job];
    return this.status(job).then((status) => {
      result.status = status;
      return result;
    });
  };

  function setStatus(job, status) {
    return options.repo.get(Scheduler.statusRepoKey)
      .then((statuses) => {
        statuses[job] = status;
        return options.repo.set(Scheduler.statusRepoKey, statuses);
      })
      .then(() => status);
  }

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.manualStart = function (job) {
    try {
      let jobs = options.settings.get('jobs');
      if (!jobs.hasOwnProperty(job)) {
        throw new Error(`Задание ${job} не найдено в конфигурации`);
      }

      return setStatus(job, Scheduler.statusCodes.MANUALLY_STARTING);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.run = function (job) {
    try {
      let jobs = options.settings.get('jobs');
      if (!jobs.hasOwnProperty(job)) {
        throw new Error(`Задание ${job} не найдено в конфигурации.`);
      }
      return setStatus(job, Scheduler.statusCodes.STARTING);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @returns {Promise}
   */
  this.stopAll = function () {
    let jobs = options.settings.get('jobs');
    return options.repo.get(Scheduler.statusRepoKey).then((statuses) => {
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && statuses.hasOwnProperty(nm) && statuses[nm] !== Scheduler.statusCodes.STOPPED) {
          statuses[nm] = Scheduler.statusCodes.STOPPING;
        }
      }
      return options.repo.set(Scheduler.statusRepoKey, statuses);
    });
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.stop = function (job) {
    return setStatus(job, Scheduler.statusCodes.STOPPING);
  };

  /**
   * @param {String} job
   * @returns {Promise}
   */
  this.removeJob = function (job) {
    return setStatus(job, Scheduler.statusCodes.STOPPED)
      .then(() => {
        let jobs = options.settings.get('jobs');
        if (jobs.hasOwnProperty(job)) {
          delete jobs[job];
          options.settings.set('jobs', jobs, true);
          return options.settings.apply();
        }
        return Promise.resolve();
      });
  };

  /**
   * @returns {Promise}
   */
  this.start = function () {
    let jobs = options.settings.get('jobs');
    return options.repo.get(Scheduler.statusRepoKey).then((statuses) => {
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && !jobs[nm].disabled && statuses[nm] !== Scheduler.statusCodes.RUNNING) {
          if (statuses[nm] !== Scheduler.statusCodes.MANUALLY_STARTING) {
            statuses[nm] = Scheduler.statusCodes.STARTING;
          }
        }
      }
      return options.repo.set(Scheduler.statusRepoKey, statuses);
    });
  };

  /**
   * @returns {Promise}
   */
  this.restart = function () {
    let jobs = options.settings.get('jobs');
    return options.repo.get(Scheduler.statusRepoKey).then((statuses) => {
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && statuses.hasOwnProperty(nm)) {
          if (statuses[nm] !== Scheduler.statusCodes.MANUALLY_STARTING) {
            statuses[nm] = Scheduler.statusCodes.RESTARTING;
          }
        }
      }
      return options.repo.set(Scheduler.statusRepoKey, statuses);
    });
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
}

module.exports = SchedulerAgent;
