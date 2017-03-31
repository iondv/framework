/**
 * Created by kras on 03.11.16.
 */
'use strict';
const chain = require('../util').argCalcChain;
const chainSync = require('../util').argCalcChainSync;

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      return chainSync(this, args, false);
    }
    return chain(this, args, false);
  };
};
