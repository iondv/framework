/**
 * Created by krasilneg on 19.04.17.
 */
'use strict';
const moment = require('moment');
const ac = require('../util').argCalcPromise;

module.exports = function (args) {
  return function () {
    var _this = this;
    return ac(_this, args, 3).then(function (args) {
        var d = new Date();
        if (args.length) {
          d = args[0];
        }
        var f = 'L';
        if (args.length > 1) {
          f = String(args[1]);
        }
        var lang = null;
        if (args.length > 2) {
          lang = String(args[2]);
        }
        d = moment(d);
        if (lang) {
          d.locale(lang);
        }
        return Promise.resolve(d.format(f));
      });
  };
};
