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
      var _this = this;
      if (sync) {
        let cArgs = acSync(this, args);
        return countResult(cArgs, start, cb);
      } else {
        return ac(_this, args)
          .then(function (args) {
            let result = countResult(args, start, cb);
            return Promise.resolve(result);
          });
      }
    };
  };
};
