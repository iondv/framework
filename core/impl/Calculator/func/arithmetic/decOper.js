/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

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
    return function (sync) {
      if (sync) {
        let cArgs = acSync(this, args);
        return countResult(cArgs, cb);
      }
      return ac(this, args).then(cArgs => countResult(cArgs, cb));
    };
  };
};
