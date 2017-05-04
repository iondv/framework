/**
 * Created by krasilneg on 10.02.17.
 */
'use strict';
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function round(args) {
  var v1, v2;
  if (!args.length) {
    return 0;
  }
  v1 = parseFloat(args[0]);
  v2 = 0;
  if (args.length > 1 && !isNaN(args[1])) {
    v2 = args[1];
  }
  return v1.toFixed(v2);
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      try {
        let cArgs = acSync(this, args, 2);
        let result = round(cArgs);
        return result;
      } catch (err) {
        return null;
      }
    }
    return ac(this, args, 2)
      .then(cArgs => {
        try {
          let result = round(cArgs);
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      });
  };
};
