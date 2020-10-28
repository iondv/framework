/**
 * Created by krasilneg on 15.06.17.
 */
'use strict';
const calc = require('../util').calculate;
const F = require('core/FunctionCodes');
const Item = require('core/interfaces/DataRepository').Item;
const i18n = require('core/i18n');
const t = msg => i18n.t(msg)({domain: 'formula'});

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = function (dataRepo) {
    return function (args) {
      return function () {
        return calc(this, args, null, function (args) {
          let options = {};
          let n = args.length;
          if (n && Array.isArray(args[n - 1])) {
            options.forceEnrichment = [];
            args[args.length - 1].forEach((path) => {
              options.forceEnrichment.push(path.split('.'));
            });
            n--;
          }

          if (n > 0) {
            if (n === 1) {
              if (!(args[0] instanceof Item)) {
                throw new Error(t('Nescessary arguments are not specified for fetch function!'));
              }
              return dataRepo.getItem(args[0], null, options);
            } else if (n === 2) {
              return dataRepo.getItem(args[0], args[1], options);
            } else {
              let filter = [];
              for (let i = 1; i < n; i = i + 2) {
                if (i + 1 < n) {
                  filter.push({[F.EQUAL]: ['$' + args[i], args[i + 1]]});
                }
              }
              if (filter.length) {
                options.filter = {[F.AND]: filter};
              }
              return dataRepo
                .getList(args[0], options)
                .then(data => data.length ? data[0] : null);
            }
          } else {
            throw new Error(t('Nescessary arguments are not specified for fetch function!'));
          }
        });
      };
    };
};