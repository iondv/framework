/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('./oper');
const skipper = require('./skipper');
const Item = require('core/interfaces/DataRepository').Item;
const p = require('./processed');

// jshint maxstatements: 30, maxcomplexity: 20
function work(col, attr, cond, unique) {
  let result = 0;
  let processed = p();
  if (Array.isArray(col)) {
    let cb = (item) => {
      if (item !== null) {
        if (unique && processed(item)) {
          return;
        }

        let v = null;
        if (attr.indexOf('.') > 0) {
          let att = attr.substr(0, attr.indexOf('.'));
          let satt = attr.substr(attr.indexOf('.') + 1);
          v = item instanceof Item ? item.property(att).evaluate() : item[att];
          if (!Array.isArray(v)) {
            v = [v];
          }
          v = work(v, satt, null, unique);
        } else {
          v = item instanceof Item ? item.get(attr) : item[attr];
        }

        if (v !== null) {
          result = result + v;
        }
      }
    };

    if (cond) {
      return skipper(col, cond, cb).then(() => result);
    }
    col.forEach(cb);
  }
  return result;
}

/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(work, 'sum');
