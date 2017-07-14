/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;

module.exports = function (collFunc, af) {
  /**
   * @param {DataRepository} dataRepo
   * @returns {Function}
   */
  return function (dataRepo) {
    return function (args) {
      return function () {
        return calc(this, args, 3, function (args) {
          if (args.length > 0) {
            if (Array.isArray(args[0])) {
              return collFunc(
                args[0],
                args.length > 1 ? (typeof args[1] === 'function' ? args[1] : String(args[1])) : null,
                args.length > 2 && typeof args[2] === 'function' ? args[2] : null
              );
            } else if (typeof args[0] === 'string') {
              let opts = args.length > 2 && typeof args[2] === 'object' ? {filter: args[2]} : {};
              let oper = {};
              oper['$' + af] = args[1];
              opts.aggregates = {result: oper};
              return dataRepo.aggregate(args[0], opts).then(function (data) {
                return Promise.resolve(data.result);
              });
            } else {
              return null;
            }
          } else {
            throw new Error('Не указан источник данных агрегации!');
          }
        });
      };
    };
  };
};

