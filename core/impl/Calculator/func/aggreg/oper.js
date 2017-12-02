/**
 * Created by kras on 03.11.16.
 */
'use strict';
const calc = require('../util').calculate;
const F = require('core/FunctionCodes');

// jshint maxcomplexity
module.exports = function (collFunc, af) {
  /**
   * @param {DataRepository} dataRepo
   * @returns {Function}
   */
  return function (dataRepo) {
    return function (args) {
      return function () {
        return calc(this, args, 5, function (args) {
          if (args.length > 0) {
            if (Array.isArray(args[0])) {
              return collFunc(
                args[0],
                args.length > 1 ? (typeof args[1] === 'function' ? args[1] : String(args[1])) : null,
                args.length > 2 ? args[2] : null,
                args.length > 3 ? args[3] : null,
                args.length > 4 ? args[4] : null
              );
            } else if (typeof args[0] === 'string') {
              let opts = {};
              if (args.length > 2 && args[2] && typeof args[2] === 'object') {
                let f = [];
                for (let attr in args[2]) {
                  if (args[2].hasOwnProperty(attr)) {
                    f.push({[F.EQUAL]: ['$' + attr, args[2][attr]]});
                  }
                }
                if (f.length) {
                  opts.filter = f.length > 1 ? {[F.AND]: f} : f[0];
                }
              }
              opts.aggregates = {result: {[af]: ['$' + args[1]]}};
              return dataRepo.aggregate(args[0], opts).then((data) => {
                return data[0].result;
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

