/**
 * Created by kras on 03.11.16.
 */
'use strict';
const moment = require('moment');
const calc = require('../util').calculate;

function countResult(args) {
  var v1, v2, v3;
  v1 = null;
  if (args.length) {
    v1 = moment(args[0]);
    v2 = 0;
    if (args.length > 1 && !isNaN(args[1])) {
      v2 = args[1];
    }
    v3 = 'd';
    if (args.length > 2) {
      v3 = String(args[2]);
    }
    return v1.add(v2, v3).toDate();
  } else {
    return new Date();
  }
}

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, countResult);
  };
};
