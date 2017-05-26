/**
 * Created by krasilneg on 10.02.17.
 */
'use strict';
const calc = require('../util').calculate;

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
  return function () {
    return calc(this, args, null, function (args) {
      return round(args);
    });
  };
};
