/**
 * Created by Данил on 10.10.2016.
 */
'use strict';

var ConditionTypes = require('core/ConditionTypes');
var OperationTypes = require('core/OperationTypes');

/**
 * @param {StoredCondition} condition
 * @returns {}
 */
function ConditionParser(condition) {
  var result = {};
  if(condition.property !== null) {
    switch(condition.operation) {
      case ConditionTypes.EQUAL: result[condition.property] = {$eq: condition.value}; break;
      case ConditionTypes.NOT_EQUAL: result[condition.property] = {$ne: condition.value}; break;
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
      case ConditionTypes.LIKE: result[condition.property] = {$regex: new RegExp(condition.value)}; break;
      case ConditionTypes.LESS: result[condition.property] = {$lt: condition.value}; break;
      case ConditionTypes.MORE: result[condition.property] = {$gt: condition.value}; break;
      case ConditionTypes.LESS_OR_EQUAL: result[condition.property] = {$lte: condition.value}; break;
      case ConditionTypes.MORE_OR_EQUAL: result[condition.property] = {$gte: condition.value}; break;
      case ConditionTypes.IN: result[condition.property] = {$in: condition.value}; break;
    }
  } else {
    var value = [];
    for(var i = 0; i < condition.nestedConditions.length; i++) {
      value[value.length] = ConditionParser(condition.nestedConditions[i]);
    }
    switch(condition.operation) {
      case OperationTypes.AND: result.$and = value; break;
      case OperationTypes.OR: result.$or = value; break;
      case OperationTypes.NOT: result.$not = {$and: value}; break;
    }
  }
  return result;
}

module.exports = ConditionParser;
