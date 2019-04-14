'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, null,
      function (args) {
        let arr = [];
        let v = args.length ? args[0] : null;
        if (args.length > 1) {
          if (Array.isArray(args[1])) {
            arr = args[1];
          }
        }
        return arr.indexOf(v) >= 0;
      }
    );
  };
};