/**
 * Created by krasilneg on 10.02.17.
 */
'use strict';
const calc = require('../util').calculate;
const {round10} = require('expected-round');

function round(args) {
  let v1, v2;
  if (!args.length) {
    return 0;
  }
  v1 = parseFloat(args[0]);

  if (!Number.isFinite(v1)) {
    return v1;
  }

  v2 = 0;
  if (args.length > 1 && !isNaN(args[1])) {
    v2 = args[1];
  }
  return round10(v1, -(v2));
}

module.exports = function (args) {
  return function () {
    return calc(this, args, null, function (args) {
      return round(args);
    });
  };
};
