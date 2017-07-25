/**
 * Created by krasilneg on 14.07.17.
 */
'use strict';
const c = require('./oper');
const Item = require('core/interfaces/DataRepository').Item;
// jshint maxcomplexity: 20
/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(
  function (col, attr, cond, sep) {
    let result = '';
    if (Array.isArray(col)) {
      for (let i = 0; i < col.length; i++) {
        if (col[i] !== null) {
          if (cond) {
            if (!cond.apply(col[i])) {
              continue;
            }
          }
          let v = col[i] instanceof Item ? col[i].get(attr) : col[i][attr];
          if (v) {
            if (Array.isArray(v)) {
              v = v.join(sep || ' ');
            }
            result = result + v + (sep || ' ');
          }
        }
      }
    }
    return result;
  },
  'sum'
);
