'use strict';
const calc = require('../util').calculate;

function processArg(arg, result) {
  if (Array.isArray(arg)) {
    arg.forEach((arg) => processArg(arg, result));
  } else if (arg !== null) {
    result.push(arg);
  }
}

module.exports = function (args) {
    return function () {
      return calc(this, args, null, function (args) {
        let result = [];
        args.forEach((arg) => processArg(arg, result));
        return result;
      });
    };
};