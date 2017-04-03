/**
 * Created by kras on 03.11.16.
 */
'use strict';
const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

module.exports = function (collFunc, af) {
  /**
   * @param {DataRepository} dataRepo
   * @returns {Function}
   */
  return function (dataRepo) {
    return function (args) {
      return function (sync) {
        if (sync) {
          return null;
        }
        var _this = this;
        return new Promise(function (resolve, reject) {
          ac(_this, args, 3).then(function (args) {
            if (args.length > 0) {
              if (Array.isArray(args[0])) {
                resolve(
                  collFunc(
                    args[0],
                    args.length > 1 ? String(args[1]) : null,
                    args.length > 2 && typeof args[2] === 'function' ? args[2] : null
                  )
                );
              } else if (typeof args[0] === 'string') {
                var opts = args.length > 2 && typeof args[2] === 'object' ? {filter: args[2]} : {};
                var oper = {};
                oper['$' + af] = args[1];
                opts.aggregates = {result: oper};
                dataRepo.aggregate(args[0], opts).then(function (data) {
                  resolve(data.result);
                }).catch(reject);
              } else {
                return resolve(null);
              }
            } else {
              reject(new Error('Не указан источник данных агрегации!'));
            }
          }).catch(reject);
        });
      };
    };
  };
};

