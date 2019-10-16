/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 12/21/16.
 */

const moment = require('moment');

var segments = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];
var segmentCaptions = {
  month: ['', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
    'november', 'december'],
  weekday: ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday','sunday']
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

function getBaseString(base) {
  var result = '';
  Object.keys(base).forEach(function (baseKey) {
    result += baseKey + ':' + base[baseKey] + ';';
  });
  return result;
}

function getBase(occur, baseKeys) {
  var result = {};
  for (var i = 0; i < baseKeys.length; i++) {
    result[baseKeys[i]] = occur[baseKeys[i]];
  }
  result.duration = occur.duration;
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

function createTopPeriod(segment, values) {
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
  return {
    year: duration.years(),
    month: duration.months(),
    day: duration.days(),
    weekday: duration.weeks(),
    hour: duration.hours(),
    minute: duration.minutes(),
    second: duration.seconds()
  };
}

function intervalToString(start, end, mask) { // jshint ignore:line
  var s = getDurationSegments(start);
  var e = getDurationSegments(end);
  var startString = '';
  var endString = '';
  if (mask.indexOf('month') > -1) {
    startString += segmentCaptions.month[s.month];
    endString += segmentCaptions.month[e.month];
  }
  if (mask.indexOf('day') > -1) {
    startString += (startString ? ' ' : '') + e.day + '-th';
    endString += (endString ? ' ' : '') + e.day + '-nd';
  }
  /*If (mask.indexOf('weekday') > -1) {
    StartString += segmentCaptions.month[s.month];
    endString += segmentCaptions.month[e.month];
  }
  */
  if (mask.indexOf('hour') > -1 || mask.indexOf('minute') > -1 || mask.indexOf('second') > -1) {
    if (s.second || e.second) {
      startString += (startString ? ' ' : '') +
        moment({hours: s.hour, minutes: s.minute, seconds: s.second}).format('HH:mm:ss');
      endString += (endString ? ' ' : '') +
        moment({hours: e.hour, minutes: e.minute, seconds: e.second}).format('HH:mm:ss');
    } else {
      startString += (startString ? ' ' : '') + moment({hours: s.hour, minutes: s.minute}).format('HH:mm');
      endString += (endString ? ' ' : '') + moment({hours: e.hour, minutes: e.minute}).format('HH:mm');
    }
  }
  return 'from ' + startString + ' to ' + endString;
}

function getMask(duration) {
  var d = getDurationSegments(duration);
  for (var i = 0; i < segments.length; i++) {
    if (d[segments[i]]) {
      return Object.keys(d);
    } else {
      delete d[segments[i]];
    }
  }
  return Object.keys(d);
}

function createBasePeriod(group) {
  var result = '';
  var start = moment.duration({
    seconds: group.base.second ? group.base.second : null,
    minutes: group.base.minute ? group.base.minute : null,
    hours: group.base.hour ? group.base.hour : null,
    days: group.base.day ? group.base.day : null,
    months: group.base.month ? group.base.month : null
  });
  var diff = moment.duration(group.base.duration * 1000);
  if (!getDurationSegments(diff)[group.top]) {
    var end = moment.duration(start);
    end.add(diff);
    var mask = getMask(end);
    result = intervalToString(start, end, mask);
  }
  return result;
}

function isIncluded(values1, values2) {
  for (var i = 0; i < values2.length; i++) {
    if (values1.indexOf(values2[i]) > -1) {
      return true;
    }
  }
  return false;
}

function createSkipsPeriod(group, skips) {
  var result = '';
  Object.keys(skips).forEach(function (top) {
    Object.keys(skips[top]).forEach(function (baseKey) {
      if (skips[top][baseKey].top === group.top) {
        if (isIncluded(group.values, skips[top][baseKey].values)) {
          result += (result ? ', ' : '') + createBasePeriod(skips[top][baseKey]);
        }
      } else {
        result += (result ? ', ' : '') + createBasePeriod(skips[top][baseKey]);
      }
    });
  });
  return result;
}

function createGroups(values) {
  var groups = {};
  values.forEach(function (value) {
    var levels = getLevels(Object.keys(value));
    if (levels.top) {
      if (!groups.hasOwnProperty(levels.top)) {
        groups[levels.top] = {};
      }
      var base = getBase(value, levels.base);
      var baseString = getBaseString(base);
      if (!groups[levels.top].hasOwnProperty(baseString)) {
        groups[levels.top][baseString] = {
          top: levels.top,
          base: base,
          values: []
        };
      }
      groups[levels.top][baseString].values.push(value[levels.top]);
    }
  });
  return groups;
}

function scheduleToString(value) {
  var result = '';
  var groups = createGroups(value.occurs);
  var skips = createGroups(value.skipped);
  Object.keys(groups).forEach(function (top) {
    Object.keys(groups[top]).forEach(function (baseKey) {
      groups[top][baseKey].values.sort();
      result += createTopPeriod(top, groups[top][baseKey].values);
      result += ' ' + createBasePeriod(groups[top][baseKey]);
      var skipPeriod = createSkipsPeriod(groups[top][baseKey], skips);
      if (skipPeriod) {
        result += ' (break ';
        result += skipPeriod;
        result += ')';
      }
      result += '; ';
    });
  });
  return result;
}

/**
 *
 * @param {Array|Object} value
 * @returns {String}
 */
module.exports.scheduleToString = function (value) {
  if (Array.isArray(value)) {
    var result = '';
    for (var i = 0; i < value.length; i++) {
      result += scheduleToString(value[i]);
    }
    return result;
  } else {
    return scheduleToString(value);
  }
};

/**
*
* @param {Object} value
* @returns {Boolean}
*/
module.exports.isSchedule = function (value) {
  if (value.hasOwnProperty('description') && typeof value.description === 'string' &&
    value.hasOwnProperty('item') && typeof value.item === 'string' &&
    value.hasOwnProperty('occurs') && Array.isArray(value.occurs) &&
    value.hasOwnProperty('skipped') && Array.isArray(value.skipped)) {
    for (let i = 0; i < value.occurs.length; i++) {
      if (!checkScheduleRule(value.occurs[i])) {
        return false;
      }
    }
    for (let i = 0; i < value.skipped.length; i++) {
      if (!checkScheduleRule(value.skipped[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
};

/*jshint maxcomplexity:15 */

function checkScheduleRule(rule) {
  return (!rule.duration || !isNaN(rule.duration)) &&
    (!rule.second   || !isNaN(rule.second) && rule.second >= 1 && rule.second <= 60) &&
    (!rule.minute   || !isNaN(rule.minute) && rule.minute >= 1 && rule.minute <= 60) &&
    (!rule.hour     || !isNaN(rule.hour) && rule.hour >= 0 && rule.hour <= 23) &&
    (!rule.day      || !isNaN(rule.day) && rule.day >= 1 && rule.day <= 31) &&
    (!rule.weekday  || !isNaN(rule.weekday) && rule.weekday >= 1 && rule.weekday <= 7) &&
    (!rule.month    || !isNaN(rule.month) && rule.month >= 1 && rule.month <= 12) &&
    (!rule.year     || !isNaN(rule.year)) &&
    (rule.second || rule.minute || rule.hour || rule.day || rule.weekday || rule.month || rule.year);
}
