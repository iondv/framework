/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');
const skipper = require('./skipper');
const p = require('./processed');

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  function (col, cond, unique) {
    let result = 0;
    let processed = p();

    let cb = (item) => {
      if (item) {
        if (unique && processed(item)) {
          return;
        }
        result++;
      }
    };

    if (cond) {
      return skipper(col, cond, cb).then(() => result);
    }
    col.forEach(cb);
    return result;
  },
  'count'
);
