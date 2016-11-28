/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      ac(_this, args, 1).then(function (args) {
        var result = false;
        if (args.length === 1) {
          result = !args[0];
        }
        resolve(result);
      }).catch(reject);
    });
  };
};
