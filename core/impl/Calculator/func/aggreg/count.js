/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');
const p = require('./processed');

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  function (col, cond, unique) {
    let result = 0;
    let processed = p();

    for (let i = 0; i < col.length; i++) {
      if (col[i] !== null) {
        if (cond) {
          if (!cond.apply(col[i])) {
            continue;
          }
        }
        if (unique && processed(col[i])) {
          continue;
        }
        result++;
      }
    }
    return result;
  },
  'count'
);
