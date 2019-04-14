'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
    return calc(this, args, 1,
      function (args) {
        if (args.length > 0 && args[0]) {
          if (Array.isArray(args[0]) || typeof args[0] === 'string') {
            return args[0].length;
          }
          return String(args[0]).length;
        }
        return 0;
      }
    );
  };
};