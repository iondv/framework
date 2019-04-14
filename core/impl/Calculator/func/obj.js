/* eslint no-invalid-this: off, no-sync: off */
/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('./util').args;

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
  return function () {
    let result = ac(this, args);
    if (result instanceof Promise) {
      return result.then(cArgs => countResult(cArgs));
    }
    return countResult(result);
  };
};
