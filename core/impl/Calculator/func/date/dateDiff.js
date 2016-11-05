/**
 * Created by kras on 03.11.16.
 */
'use strict';
const moment = require('monent');
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return new Promise(function (resolve, reject) {
      ac(_this, args, 3).then(function (args) {
        var v1, v2, v3;
        v1 = 'days';
        if (args.length) {
          v1 = String(args[0]);
        }
        if (args.length > 1) {
          v2 = moment(args[1]);
        } else {
          v2 = moment();
        }
        if (args.length > 2) {
          v3 = moment(args[2]);
        } else {
          v3 = moment();
        }
        resolve(v2.diff(v3, v1));
      }).catch(reject);
    });
  };
};
