'use strict';
/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');
const toAbsolutePath = require('core/system').toAbsolute;

/**
 * @param {{}} options
 * @param {SettingsRepository} options.settings
 * @param {Repository} options.repo
 * @param {Logger} [options.log]
 * @param {Number} [options.stopTimeout]
 * @param {Number} [options.syncInterval]
 * @constructor
 */
function Scheduler(options) {
  let runned = false;

  let inSync = false;

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

  function setStatus(job, status) {
    return options.repo.get(Scheduler.statusRepoKey)
      .then((statuses) => {
        statuses[job] = status;
        return options.repo.set(Scheduler.statusRepoKey, statuses);
      });
  }

  function sync() {
    if (!inSync) {
      inSync = true;
      options.repo.get(Scheduler.statusRepoKey)
        .then((statuses) => {
          let jobs = options.settings.get('jobs');
          let result = Promise.resolve();
          for (let nm in jobs) {
            if (jobs.hasOwnProperty(nm) && statuses.hasOwnProperty(nm)) {
              const status = statuses[nm];
              if (
                (
                  (
                    status === Scheduler.statusCodes.RUNNING ||
                    status === Scheduler.statusCodes.STARTING ||
                    status === Scheduler.statusCodes.RESTARTING
                  ) && !runned[nm]
                )
              ) {
                runned[nm] = child.fork(toAbsolutePath('bin/job-runner'), [nm], {stdio: ['pipe', 'inherit', 'inherit', 'ipc']});
                if (status === Scheduler.statusCodes.STARTING || status === Scheduler.statusCodes.RESTARTING) {
                  result = result.then(() => setStatus(nm, Scheduler.statusCodes.RUNNING));
                }
              }
              if (status === Scheduler.statusCodes.MANUALLY_STARTING && !runned[nm]) {
                runned[nm] = child.fork(toAbsolutePath('bin/job'), [nm], {stdio: ['pipe', 'inherit', 'inherit', 'ipc']});
                runned[nm].on('exit', () => {
                  delete runned[nm];
                  setStatus(nm, Scheduler.statusCodes.STOPPED)
                    .catch((err) => {
                      if (options.log) {
                        options.log.error(err);
                      } else {
                        console.error(err);
                      }
                    });
                });
                result = result.then(() => setStatus(nm, Scheduler.statusCodes.RUNNING));
              } else if (
                (status === Scheduler.statusCodes.STOPPED || status === Scheduler.statusCodes.STOPPING) &&
                runned[nm]
              ) {
                result = result.then(() => stopper(nm, runned[nm])).then(() => {
                  delete runned[nm];
                });
                if (status === Scheduler.statusCodes.STOPPING) {
                  result = result.then(() => setStatus(nm, Scheduler.statusCodes.STOPPED));
                }
              } else if (status === Scheduler.statusCodes.STARTING && runned[nm]) {
                result = result.then(() => setStatus(nm, Scheduler.statusCodes.RUNNING));
              } else if (status === Scheduler.statusCodes.STOPPING && !runned[nm]) {
                result = result.then(() => setStatus(nm, Scheduler.statusCodes.STOPPED));
              } else if (status === Scheduler.statusCodes.RESTARTING && runned[nm]) {
                result = result
                  .then(() => stopper(nm, runned[nm]))
                  .then(() => {
                    runned[nm] = child.fork(toAbsolutePath('bin/job-runner'), [nm], {stdio: ['pipe', 'inherit', 'inherit', 'ipc']});
                    return setStatus(nm, Scheduler.statusCodes.RUNNING);
                  });
              }
            }
          }
          return result;
        })
        .then(() => {
          inSync = false;
        })
        .catch((err) => {
          if (options.log) {
            options.log.error(err);
          } else {
            console.error(err);
          }
          inSync = false;
        });
    }
  }

  /**
   * @returns {Promise}
   */
  this.start = function () {
    try {
      runned = {};
      let statuses = {};
      let jobs = options.settings.get('jobs');
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm) && !jobs[nm].disabled) {
          runned[nm] = child.fork(toAbsolutePath('bin/job-runner'), [nm], {stdio: ['pipe','inherit','inherit','ipc']});
          statuses[nm] = Scheduler.statusCodes.RUNNING;
        }
      }
      return options.repo.set(Scheduler.statusRepoKey, statuses)
        .then(() => {
          setInterval(sync, options.syncInterval || 10000);
        });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  this.isActive = function () {
    return runned !== false;
  };
}

Scheduler.statusCodes = {
  STOPPED: 0,
  STARTING: 1,
  RESTARTING: 2,
  RUNNING: 3,
  STOPPING: 4,
  MANUALLY_STARTING: 5
};

Scheduler.statusRepoKey = 'schedule:jobs:statuses'

module.exports = Scheduler;
