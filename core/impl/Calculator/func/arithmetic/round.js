/**
 * Created by krasilneg on 10.02.17.
 */
'use strict';
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return ac(_this, args, 2)
      .then(function (args) {
        var v1, v2;
        v1 = null;
        if (args.length) {
          try {
            v1 = parseFloat(args[0]);
            v2 = 0;
            if (args.length > 1 && !isNaN(args[1])) {
              v2 = args[1];
            }
          } catch (err) {
            return Promise.reject(err);
          }
          return Promise.resolve(v1.toFixed(v2));
        } else {
          return Promise.resolve(0);
        }
      });
  };
};
