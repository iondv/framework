/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

function countResult(args, cb) {
  if (!args.length) {
    return 0;
  }
  var result = args[0];
  for (var i = 1; i < args.length; i++) {
    result = cb(result, args[i]);
  }
  return result;
}

module.exports = function (cb) {
  return function (args) {
    return function () {
      return calc(this, args, null, function (args) {
        return countResult(args, cb);
      });
    };
  };
};
