/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/30/17.
 */
'use strict';
const calc = require('../util').calculate;

function ifStatetement([expression, trueCase, falseCase]) {
  return expression ? trueCase : falseCase;
}

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, ifStatetement);
  };
};
