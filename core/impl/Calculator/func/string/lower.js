'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 1, ([v]) => {
      return String(v).toLowerCase();
    });
  };
};