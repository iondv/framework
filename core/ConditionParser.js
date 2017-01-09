/**
 * Created by Данил on 10.10.2016.
 */
'use strict';
// jshint maxstatements: 30

const PropertyTypes = require('core/PropertyTypes');
const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');

const BoolOpers = [OperationTypes.AND, OperationTypes.OR, OperationTypes.NOT];
const AgregOpers = [OperationTypes.MIN, OperationTypes.MAX, OperationTypes.AVG,
  OperationTypes.SUM, OperationTypes.COUNT];

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
      throw new Error('Условие CONTAINS не применимо к атрибуту ' + rcm.getCanonicalName() + '.' + condition.property);
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
 * @returns {{className: String, collectionName: String, property: String, filter: {}} | null}
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
  if (!filter) {
    return null;
  }
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
 * @returns {Array | null}
 */
function produceArray(conditions, rcm, context) {
  var tmp;
  var result = [];
  for (var i = 0; i < conditions.length; i++) {
    tmp = ConditionParser(conditions[i], rcm, context);
    if (tmp) {
      result.push(tmp);
    }
  }
  return result.length ? result : null;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @param {Item} [context]
 * @returns {{} | null}
 */
function ConditionParser(condition, rcm, context) {
  var result, tmp;
  if (Array.isArray(condition)) {
    tmp = produceArray(condition, rcm);
    if (tmp) {
      return {$and: tmp};
    }
  } else {
    if (condition.property) {
      result = {};
      switch (parseInt(condition.operation)) {
        case ConditionTypes.EMPTY: {
          result.$or = [{}, {}, {}];
          result.$or[0][condition.property] = {$eq: null};
          result.$or[1][condition.property] = {$eq: ''};
          result.$or[2][condition.property] = {$exists: false};
          return result;
        } break;
        case ConditionTypes.NOT_EMPTY: {
          result.$and = [{}, {}, {}];
          result.$and[0][condition.property] = {$ne: null};
          result.$and[1][condition.property] = {$ne: ''};
          result.$and[2][condition.property] = {$exists: true};
          return result;
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
      if (result.hasOwnProperty(condition.property)) {
        return result;
      }
    } else {
      if (BoolOpers.indexOf(condition.operation) !== -1) {
        tmp = produceArray(condition.nestedConditions, rcm, context);
        if (tmp) {
          result = {};
          switch (condition.operation) {
            case OperationTypes.AND: result.$and = tmp; break;
            case OperationTypes.OR: result.$or = tmp; break;
            case OperationTypes.NOT: result.$not = {$and: tmp}; break;
          }
          return result;
        }
      } else if (AgregOpers.indexOf(condition.operation) !== -1) {
        tmp =  produceAggregationOperation(condition, rcm, context);
        if (tmp) {
          result = {};
          switch (condition.operation) {
            case OperationTypes.MIN: result.$min = tmp; break;
            case OperationTypes.MAX: result.$max = tmp; break;
            case OperationTypes.AVG: result.$avg = tmp; break;
            case OperationTypes.SUM: result.$sum = tmp; break;
            case OperationTypes.COUNT: result.$count = tmp; break;
          }
          return result;
        }
      }
    }
  }
  return null;
}

module.exports = ConditionParser;
