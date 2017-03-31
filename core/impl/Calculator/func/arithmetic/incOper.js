/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function countResult(args, start, cb) {
  var result = start;
  for (var i = 0; i < args.length; i++) {
    result = cb(result, args[i]);
  }
  return result;
}

module.exports = function (cb, start) {
  return function (args) {
    return function (sync) {
      if (sync) {
        let cArgs = acSync(this, args);
        return countResult(cArgs, start, cb);
      } else {
        return ac(this, args).then(cArgs => countResult(cArgs, start, cb));
      }
    };
  };
};
