/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      ac(_this, args).then(function (args) {
        var result = {};
        var i, nm;
        nm = null;
        for (i = 0; i < args.length; i++) {
          if (i % 2 === 0) {
            nm = args[i];
            result[nm] = null;
          } else if (nm) {
            result[nm] = args[i];
            nm = null;
          }
        }
        resolve(result);
      }).catch(reject);
    });
  };
};
