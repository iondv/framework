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
        ac(_this, args).then(function (args) {
          if (!args.length) {
            resolve(0);
          }
          var result = args[0];
          for (var i = 1; i < args.length; i++) {
            result = cb(result, args[i]);
          }
          resolve(result);
        }).catch(reject);
      });
    };
  };
};
