/**
 * Created by kras on 03.11.16.
 */
'use strict';
const moment = require('moment');
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      ac(_this, args, 3).then(function (args) {
        var v1, v2, v3;
        v1 = null;
        if (args.length) {
          v1 = moment(args[0]);
          v2 = 0;
          if (args.length > 1 && !isNaN(args[1])) {
            v2 = args[1];
          }
          v3 = 'd';
          if (args.length > 2) {
            v3 = String(args[2]);
          }
          resolve(v1.add(v2, v3).toDate());
        } else {
          resolve(new Date());
        }
      }).catch(reject);
    });
  };
};
