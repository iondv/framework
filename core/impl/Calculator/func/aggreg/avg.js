/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');
const Item = require('core/interfaces/DataRepository').Item;

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  function (col, attr, cond) {
    let result = 0;
    let count = 0;
    for (let i = 0; i < col.length; i++) {
      if (col[i] !== null) {
        if (cond) {
          if (!cond.apply(col[i])) {
            continue;
          }
        }
        let v = col[i] instanceof Item ? col[i].get(attr) : col[i][attr];
        if (v) {
          result = result + v;
        }
        count++;
      }
    }
    return result / count;
  },
  'avg'
);
