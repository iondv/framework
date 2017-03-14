/**
 * Created by kras on 31.10.16.
 */
'use strict';

var ConditionTypes = require('core/ConditionTypes');
var OperationTypes = require('core/OperationTypes');
var PropertyTypes = require('core/PropertyTypes');
var equal = require('core/equal');
var cast = require('core/cast');

// jshint maxcomplexity: 40, maxstatements: 30, eqeqeq: false
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

/**
 * @param {Array} collection
 * @param {Array} conditions
 * @returns {Boolean}
 */
function colContains(collection, conditions) {
  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      let r = conjunct(collection[i], conditions);
      if (r) {
        return true;
      }
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
function checkCondition(item, condition, context) {
  var pn, p, v;
  if (condition.property) {
    pn = condition.property;
    p = item.property(pn);
    if (!p) {
      throw new Error('Не найден указанный в условии атрибут ' + item.getClassName() + '.' + pn);
    }
    switch (condition.operation) {
      case ConditionTypes.EQUAL:
        return equal(item.get(pn), cast(toScalar(condition.value, context), p.getType()));
      case ConditionTypes.NOT_EQUAL:
        return !equal(item.get(pn), cast(toScalar(condition.value, context), p.getType()));
      case ConditionTypes.EMPTY: {
        v = p.evaluate() || item.get(pn);
        if (Array.isArray(v)) {
          return v.length === 0;
        }
        return v === null || v === '' || typeof v === 'undefined' ? true : false;
      }break;
      case ConditionTypes.NOT_EMPTY: {
        v = p.evaluate() || item.get(pn);
        if (Array.isArray(v)) {
          return v.length > 0;
        }
        return v === null || v === '' || typeof v === 'undefined' ? false : true;
      }break;
      case ConditionTypes.LIKE:
        return String(item.get(pn)).match(
          new RegExp(cast(toScalar(condition.value, context), p.getType()))
        ) ? true : false;
      case ConditionTypes.LESS:
        return item.get(pn) < cast(toScalar(condition.value, context), p.getType()) ? true : false;
      case ConditionTypes.MORE:
        return item.get(pn) > cast(toScalar(condition.value, context), p.getType()) ? true : false;
      case ConditionTypes.LESS_OR_EQUAL:
        return item.get(pn) <= cast(toScalar(condition.value, context), p.getType()) ? true : false;
      case ConditionTypes.MORE_OR_EQUAL:
        return item.get(pn) >= cast(toScalar(condition.value, context), p.getType()) ? true : false;
      case ConditionTypes.IN:
        return contains(toArray(condition.value), item.get(pn));
      case ConditionTypes.CONTAINS: {
        if (p.getType() === PropertyTypes.COLLECTION) {
          return colContains(p.evaluate(), condition.nestedConditions);
        } else {
          return contains(p.evaluate(), cast(toScalar(condition.value, context), p.getType()));
        }
      }
    }
  } else if (condition.nestedConditions) {
    switch (condition.operation) {
      case OperationTypes.AND: return conjunct(item, condition.nestedConditions, context);
      case OperationTypes.OR: return disjunct(item, condition.nestedConditions, context);
      case OperationTypes.NOT: return !conjunct(item, condition.nestedConditions, context);
    }
  }
  return false;
}

function conjunct(item, conditions, context) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (!checkCondition(item, conditions[i], context)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function disjunct(item, conditions, context) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (checkCondition(item, conditions[i], context)) {
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
 * @param {Item} [context]
 */
module.exports = function (item, conditions, context) {
  return conjunct(item, conditions, context || item);
};
