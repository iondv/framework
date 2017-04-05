/**
 * Created by kras on 03.11.16.
 */
'use strict';
const moment = require('moment');
const calc = require('../util').calculate;

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
  return function () {
    return calc(this, args, 3, countResult);
  };
};
