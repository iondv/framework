'use strict';
const calc = require('../util').calculate;

function pad(args) {
  var v1, v2, v3, v4;
  v1 = '';
  if (args.length) {
    v1 = String(args[0] || '');
  }
  v2 = 0;
  if (args.length > 1 && !isNaN(args[1])) {
    v2 = parseInt(args[1]);
  }
  v3 = '0';
  if (args.length > 2) {
    v3 = String(args[2]);
  }
  v4 = 'l';
  if (args.length > 3 && (args[3] === 'l' || args[3] === 'r')) {
    v4 = args[3];
  }

  let n = v1.length;
  while (v2 > n) {
    if (v4 === 'l') {
      v1 = v3 + v1;
    } else {
      v1 = v1 + v3;
    }
    v2--;
  }

  return v1;
}

module.exports = function (args) {
  return function () {
    return calc(this, args, 3, pad);
  };
};