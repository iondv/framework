/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/30/17.
 */
'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(
      this,
      args,
      1,
      cond => cond[0] ? calc(this, [args[1]], 1, r => r[0]) : calc(this, [args[2]], 1, r => r[0])
    );
  };
};
