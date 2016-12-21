/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 12/21/16.
 */

const moment = require('moment');
const util = require('util');
/*
 { description: 'Недельное расписание',
 occurs:
 [ { weekday: 1, duration: 3600, hour: '13', minute: '00' },
 { weekday: 5, duration: 3600, hour: '13', minute: '00' },
 { weekday: 2, duration: 5400, hour: '03', minute: '00' },
 { weekday: 3, duration: 5400, hour: '03', minute: '00' },
 { weekday: 6, duration: 5400, hour: '03', minute: '00' } ],
 skipped:
 [ { weekday: 1, hour: '18', minute: '15', duration: 5400 },
 { weekday: 5, hour: '18', minute: '15', duration: 5400 },
 { weekday: 2, hour: '05', minute: '00', duration: 36000 },
 { weekday: 3, hour: '05', minute: '00', duration: 36000 },
 { weekday: 6, hour: '05', minute: '00', duration: 36000 } ] }
*/

/*
 "second": 30, // 1 - 60
 "minute": 20, // 1 - 60
 "hour": 9, // 0 - 23
 "day": 5, // 1 - 31
 "weekday": 1 // 1 - 7
 "month": 3 // 1 - 12
 "year": 2,
 "duration": 30 //
 */

var segments = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];
var segmentCaptions = {
  month: ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь',
    'ноябрь', 'декабрь'],
  weekday: ['', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']
};

function getLevels(keys) {
  var result = {
    top: null,
    base: []
  };
  for (var i = 0; i < segments.length; i++) {
    if (keys.indexOf(segments[i]) > -1) {
      if (!result.top) {
        result.top = segments[i];
      } else {
        result.base.push(segments[i]);
      }
    }
  }
  return result;
}

function getBaseString(occur, base) {
  var result = '';
  for (var i = 0; i < base.length; i++) {
    result += base[i] + ':' + occur[base[i]] + ';';
  }
  result += 'duration:' + occur.duration;
  return result;
}

function isSequential(values) {
  if (values.length > 2) {
    for (var i = 1; i < values.length; i++) {
      if (values[i] - values[i - 1] > 1) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function createPeriod(segment, values) {
  var i;
  var result = '';
  if (isSequential(values)) {
    if (segmentCaptions[segment]) {
      result = segmentCaptions[segment][values[0]] + '-' + segmentCaptions[segment][values[values.length - 1]];
    } else {
      result = values[0] + '-' + values[values.length - 1];
    }
  } else {
    if (segmentCaptions[segment]) {
      for (i = 0; i < values.length; i++) {
        if (segmentCaptions[segment][values[i]]) {
          result += segmentCaptions[segment][values[i]];
          if (i !== values.length - 1) {
            result += ',';
          }
        }
      }
    } else {
      for (i = 0; i < values.length; i++) {
        result += segmentCaptions[segment][values[i]];
        if (i !== values.length - 1) {
          result += ',';
        }
      }
    }
  }
  return result;
}

function getDurationSegments(duration) {
  var dur = moment.duration(duration * 1000);
  console.log('duration', duration);
  return {
    years: dur.years(),
    months: dur.months(),
    days: dur.days(),
    weeks: dur.weeks(),
    hours: dur.hours(),
    minutes: dur.minutes(),
    seconds: dur.seconds()
  };
}

function getStart(obj) {
  var result = '';
  if (obj.base.indexOf('year') > -1) {
    result += obj.values[0].year + 'лет ';
  }
  if (obj.base.indexOf('month') > -1) {
    result += obj.values[0].year + 'месяцев ';
  }
  if (obj.base.indexOf('month') > -1) {
    result += obj.values[0].year + 'месяцев ';
  }
  return result;
}

module.exports.scheduleToString = function (value) {
  var result = '';
  var groups = {};
  value.occurs.forEach(function (occur) {
    var levels = getLevels(Object.keys(occur));
    if (levels.top) {
      if (!groups.hasOwnProperty(levels.top)) {
        groups[levels.top] = {};
      }
      var baseString = getBaseString(occur, levels.base);
      if (!groups[levels.top].hasOwnProperty(baseString)) {
        groups[levels.top][baseString] = {
          base: levels.base,
          values: []
        };
      }
      groups[levels.top][baseString].values.push(occur);
    }
  });
  Object.keys(groups).forEach(function (top) {
    Object.keys(groups[top]).forEach(function (baseKey) {
      groups[top][baseKey].values.sort(function (a, b) {
        return a[top] - b[top];
      });
      result += createPeriod(top, groups[top][baseKey].values.map(function (o) {return o[top];}));
      result += '(';
      result += getStart(groups[top][baseKey]);
      result += ')';
      //console.log(getDurationSegments(groups[top][baseKey].values[0].duration));
    });
  });
  return result;
};
