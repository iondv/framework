/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

function operation(args) {
  var result = false;
  if (args.length === 1) {
    result = !args[0];
  }
  return result;
}

module.exports = function (args) {
  return function () {
    return calc(this, args, 1, operation);
  };
};
