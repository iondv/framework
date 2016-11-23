/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;

module.exports = function (cb) {
  return function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        ac(_this, args, 2).then(function (args) {
          var result = false;
          var v1, v2;
          if (args.length === 2) {
            v1 = args[0] instanceof Date ? args[0].getTime() : args[0];
            v2 = args[1] instanceof Date ? args[1].getTime() : args[1];
            result = cb(v1, v2);
          }
          resolve(result);
        }).catch(reject);
      });
    };
  };
};
