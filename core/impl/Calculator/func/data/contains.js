'use strict';
const calc = require('../util').calculate;
const chain = require('../util').sequenceCheck;

var contains = function (args) {
  return function () {
    return calc(this, args, 2, function (args) {
      if (Array.isArray(args[0]) && args.length > 1) {
        let checkerConstructor = args[1];
        if (typeof checkerConstructor === 'function') {
          let checkers = [];
          for (let i = 0; i < args[0].length; i++) {
            let item = args[0][i];
            checkers.push(checkerConstructor.apply(item));
          }
          return chain(this, checkers, true);
        }
      }
      return false;
    });
  };
};

contains.byRefMask = [1];

module.exports = contains;
