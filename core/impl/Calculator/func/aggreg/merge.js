/**
 * Created by krasilneg on 14.07.17.
 */
'use strict';
const c = require('./oper');
const skipper = require('./skipper');
const Item = require('core/interfaces/DataRepository').Item;
const p = require('./processed');

// jshint maxcomplexity: 20, maxstatements: 30

function work(col, attr, cond, unique, sep) {
  let result = '';
  sep = sep || ' ';
  if (Array.isArray(col)) {
    let processed = p();

    let cb = (item) => {
      if (item !== null) {
        let v = null;
        if (attr.indexOf('.') > 0) {
          let att = attr.substr(0, attr.indexOf('.'));
          let satt = attr.substr(attr.indexOf('.') + 1);
          v = item instanceof Item ? item.property(att).evaluate() : item[att];
          if (!Array.isArray(v)) {
            v = [v];
          }
          v = work(v, satt, null, unique, sep);
        } else {
          v = item instanceof Item ? item.get(attr) : item[attr];
        }

        if (v) {
          if (unique && processed(v)) {
            return;
          }
          result = result + (result ? sep : '') + v;
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
