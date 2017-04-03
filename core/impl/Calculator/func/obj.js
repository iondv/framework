/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('./util').argCalcPromise;
const acSync = require('./util').argCalcSync;

function countResult(args) {
  var result = {};
  var i, nm;
  nm = null;
  for (i = 0; i < args.length; i++) {
    if (i % 2 === 0) {
      nm = args[i];
      result[nm] = null;
    } else if (nm) {
      result[nm] = args[i];
      nm = null;
    }
  }
  return result;
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      let cArgs = acSync(this, args);
      return countResult(cArgs);
    }
    return ac(this, args).then(cArgs => countResult(cArgs));
  };
};
