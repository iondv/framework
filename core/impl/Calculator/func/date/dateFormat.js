/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/30/17.
 */
'use strict';
const moment = require('moment');
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function formatDate([date, format]) {
  if (date && format) {
    return moment(date).format(format);
  }
  return null;
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      console.log('sync');
      let cArgs = acSync(this, args, 2);
      return formatDate(cArgs);
    } else {
      console.log('async');
      return ac(this, args, 2).then(formatDate);
    }
  };
};
