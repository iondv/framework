/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');

/**
 * @param {{}} options
 * @param {Boolean} options.enabled
 * @param {SettingsRepository} options.settings
 * @constructor
 */
function Scheduler(options) {
  this.init = function () {
    if (!options.enabled) {
      return Promise.resolve();
    }
    try {
      let jobs = options.settings.get('jobs');
      for (let nm in jobs) {
        if (jobs.hasOwnProperty(nm)) {
          child.fork('bin/job-runner', [nm], {silent: true});
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

module.exports = Scheduler;
