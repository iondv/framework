/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

function operation(args, cb) {
  let result = false;
  let v1, v2;
  if (args.length === 2) {
    v1 = args[0] instanceof Date ? args[0].getTime() : args[0];
    v2 = args[1] instanceof Date ? args[1].getTime() : args[1];
    result = cb(v1, v2);
  }
  return result;
}

module.exports = function (cb) {
  return function (args) {
    return function () {
      return calc(this, args, 2, function (args) {return operation(args, cb);});
    };
  };
};
