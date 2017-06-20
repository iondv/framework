/**
 * Created by krasilneg on 15.06.17.
 */
'use strict';
const calc = require('../util').calculate;

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = function (dataRepo) {
    return function (args) {
      return function () {
        return calc(this, args, null, function (args) {
          if (args.length > 0) {
            if (args.length === 2) {
              return dataRepo.getItem(args[0], args[1]).then((item) => item ? item.getItemId() : null);
            } else {
              let filter = {};
              for (let i = 1; i < args.length; i = i + 2) {
                if (i + 1 < args.length) {
                  filter[args[i]] = args[i + 1];
                }
              }
              return dataRepo.getList(args[0], {filter}).then((data) => data.length ? data[0].getItemId() : null);
            }
          } else {
            throw new Error('Не указан источник данных агрегации!');
          }
        });
      };
    };
};