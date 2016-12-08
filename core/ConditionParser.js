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
function toScalar(v) {
  if (Array.isArray(v) && v.length) {
    return v.length ? v[0] : null;
  }
  return v;
}

/**
 * @param {ClassMeta} rcm
 * @param {{}} condition
 */
function produceContainsFilter(rcm, condition) {
  var pm = rcm.getPropertyMeta(condition.property);
  console.log('кондинсьён', condition);
  if (pm) {
    if (pm.type === PropertyTypes.COLLECTION && pm.itemsClass) {
      if (condition.value && condition.value.length) {
        var tmp = {};
        tmp[pm._refClass.getKeyProperties()[0]] = {$in: condition.value};
        return {$contains: tmp};
      }
      return {$contains: ConditionParser(condition.nestedConditions, pm._refClass)};
    } else if (pm.type === PropertyTypes.STRING && condition.value) {
      return {$regex: toScalar(condition.value)};
    } else {
      throw new Error('Условие CONTAINS неприменимо к атрибуту ' + rcm.getCanonicalName() + '.' + condition.property);
    }
  } else {
    throw new Error('Указанный в условии атрибут ' + rcm.getCanonicalName() + '.' + condition.property + ' не найден');
  }
}

function produceFilter(condition, type, rcm) {
  var result = {};
  if (condition.value) {
    result[type] = toScalar(condition.value);
  } else if (condition.nestedConditions && condition.nestedConditions.length) {
    result[type] = ConditionParser(condition.nestedConditions[0], rcm);
  }
  return result;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @returns {{className: String, collectionName: String, property: String, filter: {}} | null}
 */
function produceAggregationOperation(condition, rcm) {
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

  var filter = ConditionParser(condition.nestedConditions, rcm);
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
 * @returns {Array | null}
 */
function produceArray(conditions, rcm) {
  var tmp;
  var result = [];
  for (var i = 0; i < conditions.length; i++) {
    tmp = ConditionParser(conditions[i], rcm);
    if (tmp) {
      result.push(tmp);
    }
  }
  return result.length ? result : null;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @returns {{} | null}
 */
function ConditionParser(condition, rcm) {
  var result, tmp;
  if (Array.isArray(condition)) {
    tmp = produceArray(condition, rcm);
    if (tmp) {
      return {$and: tmp};
    }
  } else {
    if (condition.property) {
      result = {};
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
        case ConditionTypes.CONTAINS: result[condition.property] = produceContainsFilter(rcm, condition);
          break;
        case ConditionTypes.EQUAL:
          result[condition.property] = produceFilter(condition, '$eq', rcm); break;
        case ConditionTypes.NOT_EQUAL:
          result[condition.property] = produceFilter(condition, '$ne', rcm); break;
        case ConditionTypes.LESS:
          result[condition.property] = produceFilter(condition, '$lt', rcm); break;
        case ConditionTypes.MORE:
          result[condition.property] = produceFilter(condition, '$gt', rcm); break;
        case ConditionTypes.LESS_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$lte', rcm); break;
        case ConditionTypes.MORE_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$gte', rcm); break;
        case ConditionTypes.LIKE: result[condition.property] = {$regex: new RegExp(toScalar(condition.value))}; break;
        case ConditionTypes.IN: result[condition.property] = {$in: condition.value}; break;
      }
      if (result.hasOwnProperty(condition.property)) {
        return result;
      }
    } else {
      if (BoolOpers.indexOf(condition.operation) !== -1) {
        tmp = produceArray(condition.nestedConditions, rcm);
        if (tmp) {
          result = {};
          switch (condition.operation) {
            case OperationTypes.AND: result.$and = produceArray(condition.nestedConditions, rcm); break;
            case OperationTypes.OR: result.$or = produceArray(condition.nestedConditions, rcm); break;
            case OperationTypes.NOT: result.$not = {$and: produceArray(condition.nestedConditions, rcm)}; break;
          }
          return result;
        }
      } else if (AgregOpers.indexOf(condition.operation) !== -1) {
        tmp =  produceAggregationOperation(condition, rcm);
        if (tmp) {
          result = {};
          switch (condition.operation) {
            case OperationTypes.MIN: result.$min = produceAggregationOperation(condition, rcm); break;
            case OperationTypes.MAX: result.$max = produceAggregationOperation(condition, rcm); break;
            case OperationTypes.AVG: result.$avg = produceAggregationOperation(condition, rcm); break;
            case OperationTypes.SUM: result.$sum = produceAggregationOperation(condition, rcm); break;
            case OperationTypes.COUNT: result.$count = produceAggregationOperation(condition, rcm); break;
          }
          return result;
        }
      }
    }
  }
  return null;
}

module.exports = ConditionParser;
