/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function operation(args) {
  var result = false;
  if (args.length === 1) {
    result = !args[0];
  }
  return result;
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      let cArgs = acSync(this, args, 1);
      return operation(cArgs);
    }
    return ac(this, args, 1).then(operation);
  };
};
