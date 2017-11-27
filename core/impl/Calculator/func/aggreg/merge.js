/**
 * Created by krasilneg on 14.07.17.
 */
'use strict';
const c = require('./oper');
const Item = require('core/interfaces/DataRepository').Item;
const p = require('./processed');

// jshint maxcomplexity: 20, maxstatements: 30

function work(col, attr, cond, unique, sep) {
  let result = '';
  sep = sep || ' ';
  if (Array.isArray(col)) {
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

        let v = null;
        if (attr.indexOf('.') > 0) {
          let att = attr.substr(0, attr.indexOf('.'));
          let satt = attr.substr(attr.indexOf('.') + 1);
          v = col[i] instanceof Item ? col[i].property(att).evaluate() : col[i][att];
          if (!Array.isArray(v)) {
            v = [v];
          }
          v = work(v, satt, null, unique, sep);
        } else {
          v = col[i] instanceof Item ? col[i].get(attr) : col[i][attr];
        }

        if (v) {
          result = result + (result ? sep : '') + v;
        }
      }
    }
  }
  return result;
}


/**
 * @param {DataRepository} dataRepo
 * @returns {Function}
 */
module.exports = c(work, 'sum');
