/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

function countResult(args) {
  var v1, v2, v3;
  v1 = '';
  if (args.length) {
    v1 = String(args[0] || '');
  }
  v2 = 0;
  if (args.length > 1 && !isNaN(args[1])) {
    v2 = args[1];
  }
  v3 = v1.length;
  if (args.length > 2 && !isNaN(args[2])) {
    v3 = args[2];
  }
  return v1.substr(v2, v3);
}

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, countResult);
  };
};

