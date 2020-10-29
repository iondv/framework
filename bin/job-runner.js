'use strict';
/* eslint no-process-exit:off, no-div-regex:off */
/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');
const moment = require('moment');
const path = require('path');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
const {format} = require('util');
const toAbsolutePath = require('core/system').toAbsolute;
const {t, lang, load} = require('core/i18n');
lang(config.lang);

errorSetup();

let jobName = false;

let interval;

// jshint maxcomplexity: 20, maxstatements: 30

function checkOddEven(conf, n) {
  if (conf !== 'even' && conf !== 'odd') {
    return false;
  }
  let mod = n % 2;
  return mod === (conf === 'even' ?  0 : 1);
}

function checkValue(conf, dv) {
  if (typeof conf === 'undefined' || conf === null) {
    return true;
  }
  if (Array.isArray(conf)) {
    if (conf.length) {
      for (let i = 0; i < conf.length; i++) {
        if (typeof conf[i] === 'number') {
          if (conf[i] === dv) {
            return true;
          }
        } else if (checkOddEven(conf[i], dv)) {
          return true;
        }
      }
      return false;
    }
  } else if (typeof conf === 'number') {
    if (dv % conf !== 0) {
      return false;
    }
  } else if (!checkOddEven(conf, dv)) {
    return false;
  }
  return true;
}

/**
 * @param {{month: *, week: *, day: *, dayOfYear: *, weekday: *, hour: *, min: *, minute: *, sec: *, second: *}} launch
 * @returns {Boolean}
 */
function checkRun(launch) {
  let d = moment();

  if (launch.week) {
    if (!checkValue(launch.week, d.isoWeek())) {
      return false;
    }
  } else {
    if (!checkValue(launch.month, d.month() + 1)) {
      return false;
    }
  }

  if (!checkValue(launch.weekday, d.isoWeekday())) {
    return false;
  }

  if (!checkValue(launch.dayOfYear, d.dayOfYear())) {
    return false;
  }

  if (!checkValue(launch.day, d.date())) {
    return false;
  }

  if (!checkValue(launch.hour, d.hour())) {
    return false;
  }

  if (!checkValue(launch.min || launch.minute, d.minute())
  ) {
    return false;
  }

  if (!checkValue(launch.sec || launch.second, d.second())
  ) {
    return false;
  }

  return true;
}

function calcCheckInterval(launch, dv) {
  if (typeof launch === 'object') {
    if (launch.sec || launch.second) {
      return 1000;
    }

    if (launch.min || launch.minute) {
      return 60000;
    }

    if (launch.hour) {
      return 3600000;
    }

    if (launch.day || launch.dayOfYear || launch.weekday) {
      return 86400000;
    }

    if (launch.week) {
      return 604800000;
    }

    return 1296000000;
  }
  return dv;
}

load(path.normalize(path.join(__dirname, '..', 'i18n')), null, config.lang)
  .then(() => {
    if (process.argv.length > 2) {
      jobName = process.argv[2];
    } else {
      console.error(t('Job name not specified'));
      process.exit(130);
    }    
    return di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents']);
  })
  .then(
    /**
     * @param {{}} scope
     * @param {SettingsRepository} [scope.settings]
     * @returns {Promise}
     */
    (scope) => {
      let jobs = scope.settings.get('jobs') || {};
      let busy = false;
      if (
        jobs.hasOwnProperty(jobName) &&
        jobs[jobName] &&
        typeof jobs[jobName] === 'object'
      ) {
        /**
         * @type {{launch: Object, worker: String}}
         */
        let job = jobs[jobName];
        if (!job.worker) {
          throw new Error(format(t('Worker component for job %s is not specified'), jobName));
        }

        if (!job.launch) {
          throw new Error(format(t('Parameters are not specified for job %s'), jobName));
        }

        let checkInterval = 1000;
        let runImmediate = false;
        let runTimeout = checkInterval;
        if (typeof job.launch === 'object') {
          runImmediate = false;
          checkInterval = job.launch.check || calcCheckInterval(job.launch, checkInterval);
          runTimeout = job.launch.timeout || checkInterval;
        } else {
          runImmediate = true;
          checkInterval = parseInt(job.launch);
          runTimeout = checkInterval;
        }

        let starter = () => {
          let run = true;
          if (!runImmediate) {
            run = checkRun(job.launch);
          }
          if (run && !busy) {
            busy = true;
            let chopts = {stdio: ['pipe', 'inherit', 'inherit', 'ipc']};
            if (Array.isArray(job.node)) {
              chopts.execArgv = job.node.concat(process.execArgv).filter((v, i, a) => {
                if (v.indexOf('=') > 0) {
                  const eqc = new RegExp('^' + v.replace(/=.*$/, '=.*') + '$');
                  return a.findIndex(v1 => (v === v1) || eqc.test(v1)) === i;
                }
                return a.indexOf(v) === i;
              });
            }
            let ch = child.fork(toAbsolutePath('bin/job'), [jobName], chopts);
            let rto = setTimeout(() => {
              if (ch.connected) {
                sysLog.warn(format(t('%s: Job %s was interrupted by timeout'), new Date().toISOString(), jobName));
                ch.kill(9);
                busy = false;
              }
            }, runTimeout);
            ch.on('exit', () => {
              clearTimeout(rto);
              busy = false;
            });
          }
          if (interval) {
            clearTimeout(interval);
          }
          interval = setTimeout(starter, checkInterval);
        };

        sysLog.info(format(t('%s: Job %s started'), new Date().toISOString(), jobName));
        starter();
      } else {
        throw new Error(format(t('Job %s not found'), jobName));
      }
    }
  )
  .catch((err) => {
    if (interval) {
      clearInterval(interval);
    }
    sysLog.error(err);
    process.exit(130);
  });
