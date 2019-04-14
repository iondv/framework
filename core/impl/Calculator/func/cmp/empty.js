'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 2, function (args) {
      return typeof args[0] === 'undefined' || args[0] === null || Array.isArray(args[0]) && !args[0].length;
    });
  };
};