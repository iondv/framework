/**
 * Created by kras on 03.11.16.
 */
'use strict';

// jshint eqeqeq: false

const c = require('./cmpOper');
const Item = require('core/interfaces/DataRepository').Item;

module.exports = c(function (a, b) {
  if (a instanceof Item && b instanceof Item) {
    a = a.getClassName() + '@' + a.getItemId();
    b = b.getClassName() + '@' + b.getItemId();
  } else {
    if (a instanceof Item) {
      a = a.getItemId();
    }

    if (b instanceof Item) {
      b = b.getItemId();
    }
  }
  return a == b;
});
