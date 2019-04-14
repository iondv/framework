/**
 * Created by kras on 25.10.16.
 */
'use strict';
const moment = require('moment');
// jshint maxcomplexity: 20
function add(parts, date) {
  var m = moment(date);
  for (var f in parts) {
    if (parts.hasOwnProperty(f)) {
      m = m.add(parts[f], f);
    }
  }
  return m.toDate();
}

/**
 * @param {String} period
 * @returns {{fraction: Function, addTo: Function}}
 */
module.exports = function (period) {
  var parts = {
    y: 0,
    M: 0,
    w: 0,
    d: 0,
    h: 0,
    m: 0,
    s: 0
  };
  var parser = /(\d+)\s*([yMwdhmsгМндчмс])/g;
  var parsed = period.match(parser);
  while ((parsed = parser.exec(period)) !== null) {
    switch (parsed[2]) {
      case 'y':
      case 'г': parts.y += parseInt(parsed[1]);break;
      case 'M':
      case 'М': parts.M += parseInt(parsed[1]);break;
      case 'w':
      case 'н': parts.w += parseInt(parsed[1]);break;
      case 'd':
      case 'д': parts.d += parseInt(parsed[1]);break;
      case 'h':
      case 'ч': parts.h += parseInt(parsed[1]);break;
      case 'm':
      case 'м': parts.m += parseInt(parsed[1]);break;
      case 's':
      case 'с': parts.s += parseInt(parsed[1]);break;
    }
  }

  return {
    fraction: function (nm) {
      return parts[nm];
    },
    addTo: function (date) {
      return add(parts, date);
    }
  };
};
