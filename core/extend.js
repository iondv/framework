'use strict';
const clone = require('clone');

module.exports = function extend() {
  let target = arguments[0];
  let i = 1;
  let length = arguments.length;
  let cln;
  if (typeof target !== 'object') {
    cln = !!target;
    if (length < 2) {
      throw new Error('Invalid parameters count');
    }
    target = cln ? clone(arguments[1]) : arguments[1];
    i = 2;
  }
  target = target || {};
  for (; i < arguments.length; i++) {
    if (arguments[i] && typeof arguments[i] === 'object') {
      let src = arguments[i];
      for (let nm in src) {
        if (src.hasOwnProperty(nm)) {
          let v = src[nm];
          if (Array.isArray(v)) {
            if (Array.isArray(target[nm])) {
              if (cln) {
                target[nm] = target[nm].concat(v);
              } else {
                target[nm].push(...v);
              }
            } else {
              target[nm] = v;
            }
          } else if (v && typeof v === 'object') {
            if (target[nm] && typeof target[nm] === 'object') {
              target[nm] = extend(cln, target[nm], v);
            } else {
              target[nm] = v;
            }
          } else {
            target[nm] = v;
          }
        }
      }
    }
  }
  return target;
};
