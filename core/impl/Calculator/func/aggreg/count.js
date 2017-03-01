/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  function (col, attr, cond) {
    var result = 0;
    for (var i = 0; i < col.length; i++) {
      if (col[i] !== null) {
        if (cond) {
          if (!cond.apply(col[i])) {
            continue;
          }
        }
        result++;
      }
    }
    return result;
  },
  'count'
);
