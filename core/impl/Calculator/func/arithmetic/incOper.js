/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

function countResult(args, start, cb) {
  var result = start;
  for (var i = 0; i < args.length; i++) {
    result = cb(result, args[i]);
  }
  return result;
}

module.exports = function (cb, start) {
  return function (args) {
    return function () {
      return calc(this, args, null, function (args) {
        return countResult(args, start, cb);
      });
    };
  };
};
