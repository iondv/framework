'use strict';
const number2words = require('core/util/number2words');
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, null,
      function (args) {
        return numbers2words(args[0], args[1]);
      }
    );
  };
};
