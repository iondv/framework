/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const merge = require('merge');
const strBase = {};

function strings(prefix, ...ids) {
  const params = (ids.length && typeof ids[ids.length - 1] !== 'string') ? ids.pop() : null;
  if (prefix && ids.length) {
    if (strBase.hasOwnProperty(prefix)) {
      let s = ids.reduce((base, id) => base && base[id], strBase[prefix]);
      if (s) {
        if (params) {
          for (let p in params) {
            if (params.hasOwnProperty(p)) {
              s = s.replace('%' + p, params[p]);
            }
          }
        }
        return s;       
      }
    }
    return ids[ids.length - 1];
  }
  return '';
}

/**
 * @param {String} prefix
 * @param {{}} base
 */
module.exports.registerBase = function (prefix, base) {
  if (prefix && base) {
    strBase[prefix] = merge(base, strBase[prefix] || {});
  }
};

/**
 * @param {String} prefix
 * @param {String} id
 * @param {{}} params
 */
module.exports.s = strings;

module.exports.unprefix = prefix => (str, params) => strings(prefix, str, params);
