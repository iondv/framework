/**
 * Created by kras on 04.09.16.
 */
'use strict';

var PropertyTypes = require('./PropertyTypes');
// jshint maxcomplexity: 30
var cast = module.exports = function (value, type) {
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

  if (type === PropertyTypes.STRING) {
    return value.toString();
  }

  switch (type){
    case PropertyTypes.BOOLEAN: {
      if (value === 'false') {
        return false;
      } else {
        return Boolean(value);
      }
    }break;
    case PropertyTypes.DATETIME: return value ? new Date(value) : null;
    case PropertyTypes.REAL:
    case PropertyTypes.DECIMAL: {
      value = parseFloat(value);
      return isNaN(value) ? null : value;
    }break;
    case PropertyTypes.SET:
    case PropertyTypes.INT: {
      value = parseInt(value);
      return isNaN(value) ? null : value;
    }break;
  }
  return value;
};
