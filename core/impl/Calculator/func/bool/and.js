/**
 * Created by kras on 03.11.16.
 */
'use strict';
const chain = require('../util').argCalcChain;

module.exports = function (args) {
  return function () {
    return chain(this, args, false);
  };
};
