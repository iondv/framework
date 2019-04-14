/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('../arithmetic/incOper');

function s(v) {
  return (v === null || v === false || typeof v === 'undefined') ? '' : String(v);
}

module.exports = c((a, b) => s(a) + s(b), '');

