/**
 * Created by Данил on 10.10.2016.
 */
'use strict';

var ConditionTypes = require('core/ConditionTypes');
var OperationTypes = require('core/OperationTypes');

// jshint maxcomplexity: 20
function toScalar(v) {
  if (Array.isArray(v) && v.length) {
    return v.length ? v[0] : null;
  }
  return v;
}

/**
 * @param {{}} condition
 * @returns {{}}
 */
function ConditionParser(condition) {
  var result = {};
  if (condition.property !== null) {
    switch (condition.operation) {
      case ConditionTypes.EQUAL: result[condition.property] = {$eq: toScalar(condition.value)}; break;
      case ConditionTypes.NOT_EQUAL: result[condition.property] = {$ne: toScalar(condition.value)}; break;
      case ConditionTypes.EMPTY: {
        result.$or = [{}, {}];
        result.$or[0][condition.property] = {$eq: null};
        result.$or[1][condition.property] = {$eq: ''};
      } break;
      case ConditionTypes.NOT_EMPTY: {
        result.$and = [{}, {}];
        result.$and[0][condition.property] = {$ne: null};
        result.$and[1][condition.property] = {$ne: ''};
      } break;
      case ConditionTypes.LIKE: result[condition.property] = {$regex: new RegExp(toScalar(condition.value))}; break;
      case ConditionTypes.LESS: result[condition.property] = {$lt: toScalar(condition.value)}; break;
      case ConditionTypes.MORE: result[condition.property] = {$gt: toScalar(condition.value)}; break;
      case ConditionTypes.LESS_OR_EQUAL: result[condition.property] = {$lte: toScalar(condition.value)}; break;
      case ConditionTypes.MORE_OR_EQUAL: result[condition.property] = {$gte: toScalar(condition.value)}; break;
      case ConditionTypes.IN: result[condition.property] = {$in: condition.value}; break;
    }
  } else {
    var value = [];
    for (var i = 0; i < condition.nestedConditions.length; i++) {
      value[value.length] = ConditionParser(condition.nestedConditions[i]);
    }
    switch (condition.operation) {
      case OperationTypes.AND: result.$and = value; break;
      case OperationTypes.OR: result.$or = value; break;
      case OperationTypes.NOT: result.$not = {$and: value}; break;
    }
  }
  return result;
}

module.exports = ConditionParser;
