/**
 * Created by kras on 04.09.16.
 */
'use strict';

var PropertyTypes = require('./PropertyTypes');

module.exports = function (value, type) {
  if (value === null) {
    return value;
  }
  if (type === PropertyTypes.STRING && value !== null) {
    return value;
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
}
