/**
 * Created by Данил on 10.10.2016.
 */
'use strict';
// jshint maxstatements: 30

const PropertyTypes = require('core/PropertyTypes');
const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');

// jshint maxstatements: 40, maxcomplexity: 30
/**
 * @param {*} v
 * @param {Item} [context]
 * @returns {*}
 */
function toScalar(v, context) {
  var result = null;
  var p;
  if (Array.isArray(v) && v.length) {
    result = v.length ? v[0] : null;
  }

  if (typeof result === 'string' && result[0] === '$' && context) {
    if ((p = context.property(result.substring(1))) !== null) {
      return p.getValue();
    }
  }

  return result;
}

/**
 * @param {ClassMeta} rcm
 * @param {{}} condition
 * @param {Item} [context]
 */
function produceContainsFilter(rcm, condition, context) {
  var pm = rcm.getPropertyMeta(condition.property);
  if (pm) {
    if (pm.type === PropertyTypes.COLLECTION && pm.itemsClass) {
      if (condition.value && condition.value.length) {
        var tmp = {};
        tmp[pm._refClass.getKeyProperties()[0]] = {$in: condition.value};
        return {$contains: tmp};
      }
      return {$contains: ConditionParser(condition.nestedConditions, pm._refClass, context)};
    } else if (pm.type === PropertyTypes.STRING && condition.value) {
      return {$regex: toScalar(condition.value, context)};
    } else {
      throw new Error('Условие CONTAINS неприменимо к атрибуту ' + rcm.getCanonicalName() + '.' + condition.property);
    }
  } else {
    throw new Error('Указанный в условии атрибут ' + rcm.getCanonicalName() + '.' + condition.property + ' не найден');
  }
}

/**
 * @param {{}} condition
 * @param {String} type
 * @param {ClassMeta} rcm
 * @param {Item} [context]
 * @returns {{}}
 */
function produceFilter(condition, type, rcm, context) {
  var result = {};
  if (condition.value) {
    result[type] = toScalar(condition.value, context);
  } else if (condition.nestedConditions && condition.nestedConditions.length) {
    result[type] = ConditionParser(condition.nestedConditions[0], rcm, context);
  }
  return result;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @param {Item} [context]
 * @returns {{className: String, collectionName: String, property: String, filter: {}}}
 */
function produceAggregationOperation(condition, rcm, context) {
  var an, av, pn, pm;
  if (!condition.value || !condition.value.length) {
    throw new Error('Некорректно указана операция агрегации - отсутствует информация о классе и свойстве.');
  }

  if (condition.value.length === 1) {
    pn = condition.value[0];
    an = 'className';
    av = rcm.getCanonicalName();
  } else {
    pn = condition.value[1];
    av = condition.value[0];
    an = 'className';
    if ((pm = rcm.getPropertyMeta(condition.value[0])) !== null) {
      if (pm.type === PropertyTypes.COLLECTION) {
        an = 'collectionName';
      }
    }
  }

  var filter = ConditionParser(condition.nestedConditions, rcm, context);
  var result = {
    property: pn,
    filter: filter
  };
  result[an] = av;
  return result;
}

/**
 * @param {Object[]} conditions
 * @param {ClassMeta} rcm
 * @param {Item} [context]
 */
function produceArray(conditions, rcm, context) {
  var result = [];
  for (var i = 0; i < conditions.length; i++) {
    result.push(ConditionParser(conditions[i], rcm, context));
  }
  return result;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @param {Item} [context]
 * @returns {{}}
 */
function ConditionParser(condition, rcm, context) {
  var result;
  if (Array.isArray(condition)) {
    result = {$and: produceArray(condition, rcm)};
  } else {
    result = {};
    if (condition.property) {
      switch (condition.operation) {
        case ConditionTypes.EMPTY: {
          result.$or = [{}, {}, {}];
          result.$or[0][condition.property] = {$eq: null};
          result.$or[1][condition.property] = {$eq: ''};
          result.$or[2][condition.property] = {$exists: false};
        } break;
        case ConditionTypes.NOT_EMPTY: {
          result.$and = [{}, {}, {}];
          result.$and[0][condition.property] = {$ne: null};
          result.$and[1][condition.property] = {$ne: ''};
          result.$and[2][condition.property] = {$exists: true};
        } break;
        case ConditionTypes.CONTAINS: result[condition.property] = produceContainsFilter(rcm, condition, context);
          break;
        case ConditionTypes.EQUAL:
          result[condition.property] = produceFilter(condition, '$eq', rcm, context); break;
        case ConditionTypes.NOT_EQUAL:
          result[condition.property] = produceFilter(condition, '$ne', rcm, context); break;
        case ConditionTypes.LESS:
          result[condition.property] = produceFilter(condition, '$lt', rcm, context); break;
        case ConditionTypes.MORE:
          result[condition.property] = produceFilter(condition, '$gt', rcm, context); break;
        case ConditionTypes.LESS_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$lte', rcm, context); break;
        case ConditionTypes.MORE_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$gte', rcm, context); break;
        case ConditionTypes.LIKE: result[condition.property] = {$regex: new RegExp(toScalar(condition.value, context))}; break;
        case ConditionTypes.IN: result[condition.property] = {$in: condition.value}; break;
      }
    } else {
      switch (condition.operation) {
        case OperationTypes.AND: result.$and = produceArray(condition.nestedConditions, rcm, context); break;
        case OperationTypes.OR: result.$or = produceArray(condition.nestedConditions, rcm, context); break;
        case OperationTypes.NOT: result.$not = {$and: produceArray(condition.nestedConditions, rcm, context)}; break;
        case OperationTypes.MIN: result.$min = produceAggregationOperation(condition, rcm, context); break;
        case OperationTypes.MAX: result.$max = produceAggregationOperation(condition, rcm, context); break;
        case OperationTypes.AVG: result.$avg = produceAggregationOperation(condition, rcm, context); break;
        case OperationTypes.SUM: result.$sum = produceAggregationOperation(condition, rcm, context); break;
        case OperationTypes.COUNT: result.$count = produceAggregationOperation(condition, rcm, context); break;
      }
    }
  }
  return result;
}

module.exports = ConditionParser;
