/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/30/17.
 */
'use strict';
const moment = require('moment');
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 2, function ([date, format]) {
      return moment(date).format(format);
    });
  };
};
