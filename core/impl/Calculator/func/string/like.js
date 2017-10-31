'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, null,
      function (args) {
        let re = new RegExp(args[1]);
        return re.test(args[0]);
      }
    );
  };
};