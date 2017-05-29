/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const merge = require('merge');
const strBase = {};

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
module.exports.s = function (prefix, id, params) {
  if (prefix && id) {
    if (strBase.hasOwnProperty(prefix)) {
      if (strBase[prefix].hasOwnProperty(id)) {
        let s = strBase[prefix][id];
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
  }
  return '';
};
