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
          var result = args[args.length - 1];
          for (var i = args.length - 2; i >= 0; i--) {
            result = cb(result, args[i]);
          }
          resolve(result);
        }).catch(reject);
      });
    };
  };
};
