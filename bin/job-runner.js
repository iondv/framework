/**
 * Created by krasilneg on 19.07.17.
 */
const child = require('child_process');
const moment = require('moment');
const config = require('../config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger(config.log || {});
const errorSetup = require('core/error-setup');
errorSetup(config.lang || 'ru');


let jobName = false;
if (process.argv.length > 2) {
  jobName = process.argv[2];
} else {
  console.error('Не передано имя задания');
  process.exit(130);
}

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
      let res = false;
      for (let i = 0; i < conf.length; i++) {
        if (typeof conf[i] === 'number') {
          if (conf[i] === dv) {
            return true;
          }
        } else if (checkOddEven(conf[i], dv)) {
          return true;
        }
      }
      return res;
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
 * @param {{month: *, week: *, day: *, dayOfYear: *, weekday: *, hour: *, min: *, sec: *}} launch
 * @returns {boolean}
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

  if (!checkValue(launch.min, d.minute())) {
    return false;
  }

  if (!checkValue(launch.sec, d.second())) {
    return false;
  }

  return true;
}

di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['application', 'rtEvents', 'sessionHandler']
)
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
        /**
         * @type {{launch: Object, worker: String}}
         */
        let job = jobs[jobName];
        if (!job.worker) {
          throw new Error('Не указан рабочий компонент задания ' + jobName);
        }

        if (!job.launch) {
          throw new Error('Не указаны параметры задания ' + jobName);
        }

        let checkInterval = 1000;
        let runImmediate = false;
        let runTimeout = checkInterval;
        if (typeof job.launch === 'object') {
          runImmediate = false;
          checkInterval = job.launch.check || checkInterval;
          runTimeout = job.launch.timeout || 3600000;
        } else {
          runImmediate = true;
          checkInterval = parseInt(job.launch);
          runTimeout = checkInterval;
        }
        interval = setInterval(() => {
          let run = true;
          if (!runImmediate) {
            run = checkRun(job.launch);
          }
          if (run) {
            let ch = child.fork('bin/job', [jobName], {stdio: ['pipe','inherit','inherit','ipc']});
            let rto = setTimeout(() => {
              if (ch.connected) {
                sysLog.warn(new Date().toISOString() + ': Задание ' + jobName +' было прервано по таймауту');
                ch.kill(9);
              }
            }, runTimeout);
            ch.on('exit', () => {
              clearTimeout(rto);
            });
          }
        }, checkInterval);
        sysLog.info(new Date().toISOString() + ': Задание ' + jobName + ' запущено');
      } else {
        throw new Error('Задание ' + jobName + ' не найдено');
      }
    }
  )
  .catch((err) => {
    try {
      clearInterval(interval);
    } catch (e) {

    }
    sysLog.error(err);
    process.exit(130);
  });