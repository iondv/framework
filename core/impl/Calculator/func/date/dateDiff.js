/**
 * Created by kras on 03.11.16.
 */
'use strict';
const moment = require('moment');
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function countResult(args) {
  var v1, v2, v3;
  v1 = 'days';
  if (args.length) {
    v1 = String(args[0]);
  }
  if (args.length > 1) {
    v2 = moment(args[1]);
  } else {
    v2 = moment();
  }
  if (args.length > 2) {
    v3 = moment(args[2]);
  } else {
    v3 = moment();
  }
  return v2.diff(v3, v1);
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      let cArgs = acSync(this, args, 3);
      return countResult(cArgs);
    }
    return ac(this, args, 3).then(countResult);
  };
};
