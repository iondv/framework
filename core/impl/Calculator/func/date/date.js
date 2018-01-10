'use strict';
const moment = require('moment');
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, function ([s, format, lang]) {
      if (!s) {
        return null;
      }
      let d = moment(s, format, lang);
      if (d.isValid()) {
        return d.toDate();
      }
      return null;
    });
  };
};