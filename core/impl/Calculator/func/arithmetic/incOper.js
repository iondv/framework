/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;

module.exports = function (cb, start) {
  return function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        ac(_this, args).then(function (args) {
          var result = start;
          for (var i = 0; i < args.length; i++) {
            result = cb(result, args[i]);
          }
          resolve(result);
        }).catch(reject);
      });
    };
  };
};
