/**
 * Created by kras on 30.08.17.
 */
'use strict';
const merge = require('merge');

/**
 * @param {{}} scope
 * @param {{}} aliases
 */
module.exports = function (scope, aliases) {
  if (!aliases) {
    return scope;
  }
  let result = merge({}, scope);
  for (let alias in aliases) {
    if (aliases.hasOwnProperty(alias)) {
      let nm = aliases[alias];
      if (scope.hasOwnProperty(nm)) {
        result[alias] = scope[nm];
      }
    }
  }
  return result;
};
