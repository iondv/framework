/**
 * Created by krasilneg on 19.04.17.
 */
'use strict';
const moment = require('moment');
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, function ([date, format, lang]) {
      if (!date) {
        return '';
      }
      var d = moment(date);
      if (lang) {
        d.locale(lang);
      }
      return d.format(String(format || 'L'));
    });
  };
};
