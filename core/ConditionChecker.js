/**
 * Created by kras on 31.10.16.
 */
'use strict';

var ConditionTypes = require('core/ConditionTypes');
var OperationTypes = require('core/OperationTypes');
var equal = require('core/equal');
var cast = require('core/cast');

// jshint maxcomplexity: 40, eqeqeq: false
function contains(container, content) {
  if (container && content !== null) {
    if (typeof container === 'string') {
      if (content) {
        return container.indexOf(String(content)) !== -1 ? true : false;
      }
    } else if (Array.isArray(container)) {
      return container.indexOf(content) !== -1 ? true : false;
    }
  }
  return false;
}

function toArray(v) {
  if (!Array.isArray(v)) {
    return [v];
  }
  return v;
}

/**
 * @param {*} v
 * @param {Item} item
 * @returns {*}
 */
function toScalar(v, item) {
  var result = null;
  var p;
  if (Array.isArray(v) && v.length) {
    result = v.length ? v[0] : null;
  }
  if (typeof result === 'string' && result[0] === '$') {
    if ((p = item.getProperty(result.substring(1))) !== null) {
      result = p.getValue();
    }
  }

  return result;
}

/**
 * @param {Item} item
 * @param {{}} condition
 * @returns {Boolean}
 */
function checkCondition(item, condition) {
  var pn, p, v;
  if (condition.property) {
    pn = condition.property;
    p = item.property(pn);
    if (!p) {
      throw new Error('Не найден указанный в условии атрибут ' + item.getClassName() + '.' + pn);
    }
    switch (condition.operation) {
      case ConditionTypes.EQUAL:
        return equal(item.get(pn), cast(toScalar(condition.value, item), p.getType()));
      case ConditionTypes.NOT_EQUAL:
        return !equal(item.get(pn), cast(toScalar(condition.value, item), p.getType()));
      case ConditionTypes.EMPTY:
        return !item.get(pn);
      case ConditionTypes.NOT_EMPTY:
        return item.get(pn) ? true : false;
      case ConditionTypes.LIKE:
        return String(item.get(pn)).match(
          new RegExp(cast(toScalar(condition.value, item), p.getType()))
        ) ? true : false;
      case ConditionTypes.LESS:
        return item.get(pn) < cast(toScalar(condition.value, item), p.getType()) ? true : false;
      case ConditionTypes.MORE:
        return item.get(pn) > cast(toScalar(condition.value, item), p.getType()) ? true : false;
      case ConditionTypes.LESS_OR_EQUAL:
        return item.get(pn) <= cast(toScalar(condition.value, item), p.getType()) ? true : false;
      case ConditionTypes.MORE_OR_EQUAL:
        return item.get(pn) >= cast(toScalar(condition.value, item), p.getType()) ? true : false;
      case ConditionTypes.IN:
        return contains(toArray(v), item.get(pn));
      case ConditionTypes.CONTAINS:
        return contains(item.get(pn), cast(toScalar(condition.value, item), p.getType()));
    }
  } else if (condition.nestedConditions) {
    switch (condition.operation) {
      case OperationTypes.AND: return conjunct(item, condition.nestedConditions);
      case OperationTypes.OR: return disjunct(item, condition.nestedConditions);
      case OperationTypes.NOT: return !conjunct(item, condition.nestedConditions);
    }
  }
  return false;
}

function conjunct(item, conditions) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (!checkCondition(item, conditions[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function disjunct(item, conditions) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (checkCondition(item, conditions[i])) {
        return true;
      }
    }
    return false;
  }
  return false;
}

/**
 * @param {Item} item
 * @param {Array} conditions
 */
module.exports = function (item, conditions) {
  return conjunct(item, conditions);
};
