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
    if (!col.length) {
      return null;
    }
    var result = 0;
    for (var i = 0; i < col.length; i++) {
      if (cond) {
        if (!cond.apply(col[i])) {
          continue;
        }
      }
      if (col[i].get(attr) > result) {
        result = col[i].get(attr);
      }
    }
    return result;
  },
  'max'
);
