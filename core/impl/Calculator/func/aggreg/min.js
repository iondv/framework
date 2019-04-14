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
  function (col, attr, cond) {
    if (!col.length) {
      return null;
    }
    let result = Number.POSITIVE_INFINITY;
    let cb = (item) => {
      if (item) {
        let v = item instanceof Item ? item.get(attr) : item[attr];
        if (v < result) {
          result = v;
        }
      }
    };

    if (cond) {
      return skipper(col, cond, cb).then(() => result);
    }

    col.forEach(cb);
    return result;
  },
  'max'
);
