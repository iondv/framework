/**
 * Created by kras on 04.09.16.
 */
'use strict';

const PropertyTypes = require('./PropertyTypes');
// jshint maxcomplexity: 30
module.exports = function cast(value, type) {
  if (value === null || typeof value === 'undefined') {
    return value;
  }

  if (Array.isArray(value)) {
    var result = [];
    for (var i = 0; i < value.length; i++) {
      result.push(cast(value[i], type));
    }
    return result;
  }

  if (
    type === PropertyTypes.STRING ||
    type === PropertyTypes.TEXT ||
    type === PropertyTypes.HTML ||
    type === PropertyTypes.URL
  ) {
    return value.toString();
  }

  switch (type){
    case PropertyTypes.BOOLEAN:
      if (value === 'false') {
        return false;
      }
      return Boolean(value);
    case PropertyTypes.DATETIME:
      return value ? (value instanceof Date ? value : new Date(value)) : null;
    case PropertyTypes.REAL:
    case PropertyTypes.DECIMAL:
      value = parseFloat(value);
      return isNaN(value) ? null : value;
    case PropertyTypes.SET:
    case PropertyTypes.INT:
      value = parseInt(value);
      return isNaN(value) ? null : value;
    default:
      return value;
  }
};
