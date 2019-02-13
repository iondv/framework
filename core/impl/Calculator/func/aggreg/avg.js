/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');
const skipper = require('./skipper');
const Item = require('core/interfaces/DataRepository').Item;

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  (col, attr, cond) => {
    let result = 0;
    let count = 0;

    let cb = (item) => {
      if (item) {
        let v = item instanceof Item ? item.get(attr) : item[attr];
        if (v) {
          result = result + v;
        }
        count++;
      }
    };

    if (cond) {
      return skipper(col, cond, cb).then(() => result / count);
    }
    col.forEach(cb);
    return result / count;
  },
  'avg'
);
