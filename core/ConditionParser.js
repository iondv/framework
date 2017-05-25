/**
 * Created by Данил on 10.10.2016.
 */
'use strict';
// jshint maxstatements: 30

const PropertyTypes = require('core/PropertyTypes');
const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');
const strToDate = require('core/strToDate');

const BoolOpers = [OperationTypes.AND, OperationTypes.OR, OperationTypes.NOT];
const AgregOpers = [OperationTypes.MIN, OperationTypes.MAX, OperationTypes.AVG,
  OperationTypes.SUM, OperationTypes.COUNT];
const Funcs = [OperationTypes.DATE, OperationTypes.DATEADD];

// jshint maxstatements: 40, maxcomplexity: 40
/**
 * @param {*} v
 * @param {Item} context
 * @param {Number} type
 * @param {String} lang
 * @returns {*}
 */
function toScalar(v, context, type, lang) {
  if (Array.isArray(v)) {
    v = v[0];
  }

  if (typeof v === 'string' && v[0] === '$' && context) {
    let p;
    if ((p = context.property(v.substring(1))) !== null) {
      return p.getValue();
    }
  }

  switch (type) {
    case PropertyTypes.INT: return parseInt(v);
    case PropertyTypes.REAL:
    case PropertyTypes.DECIMAL: return parseFloat(v);
    case PropertyTypes.DATETIME: {
      v = strToDate(v, lang);
      return v;
    }break;
    default: return v;
  }
}

function findPM(cm, name) {
  var dot = name.indexOf('.');
  if (dot === -1) {
    return cm.getPropertyMeta(name);
  }

  var pm = cm.getPropertyMeta(name.substring(0, dot));
  if (pm && pm._refClass) {
    return findPM(pm._refClass, name.substring(dot + 1));
  }
  return null;
}

/**
 * @param {ClassMeta} rcm
 * @param {{}} condition
 * @param {Item} context
 * @param {String} lang
 */
function produceContainsFilter(rcm, condition, context, lang) {
  var pm = findPM(rcm, condition.property);
  if (pm) {
    if (pm.type === PropertyTypes.COLLECTION && pm._refClass) {
      if (condition.value && condition.value.length) {
        var tmp = {};
        tmp[pm._refClass.getKeyProperties()[0]] = {
          $in: castInValue(condition.value, pm._refClass.getKeyProperties()[0], pm._refClass, context, lang)
        };
        return {$contains: tmp};
      }
      return {$contains: ConditionParser(condition.nestedConditions, pm._refClass, context, lang)};
    } else if (pm.type === PropertyTypes.STRING && condition.value) {
      return {$regex: toScalar(condition.value, context, pm.type, lang)};
    } else {
      throw new Error('Условие CONTAINS не применимо к атрибуту ' + rcm.getCanonicalName() + '.' + condition.property);
    }
  } else {
    throw new Error('Указанный в условии атрибут ' + rcm.getCanonicalName() + '.' + condition.property + ' не найден');
  }
}

/**
 * @param {ClassMeta} cm
 * @param {String} property
 */
function vt(cm, property) {
  let pm = findPM(cm, property);
  return pm ? pm.type : PropertyTypes.STRING;
}

/**
 * @param {{}} condition
 * @param {String} type
 * @param {ClassMeta} rcm
 * @param {Item} context
 * @param {String} lang
 * @returns {{}}
 */
function produceFilter(condition, type, rcm, context, lang) {
  var result = {};
  if (condition.value) {
    result[type] = toScalar(condition.value, context, vt(rcm, condition.property), lang);
  } else if (condition.nestedConditions && condition.nestedConditions.length) {
    result[type] = ConditionParser(condition.nestedConditions[0], rcm, context, lang);
  }
  return result;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @param {Item} context
 * @param {String} lang
 * @returns {{className: String, collectionName: String, property: String, filter: {}} | null}
 */
function produceAggregationOperation(condition, rcm, context, lang) {
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
    if ((pm = findPM(rcm, condition.value[0])) !== null) {
      if (pm.type === PropertyTypes.COLLECTION) {
        an = 'collectionName';
      }
    }
  }

  var filter = ConditionParser(condition.nestedConditions, rcm, context, lang);
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
 * @param {Item} context
 * @param {String} lang
 * @returns {Array | null}
 */
function produceArray(conditions, rcm, context, lang) {
  var tmp;
  var result = [];
  for (var i = 0; i < conditions.length; i++) {
    tmp = ConditionParser(conditions[i], rcm, context, lang);
    if (tmp) {
      result.push(tmp);
    }
  }
  return result.length ? result : null;
}

/**
 * @param {String[]} value
 * @param {String} property
 * @param {ClassMeta} rcm
 * @param {Item} context
 * @param {String} lang
 * @returns {Array}
 */
function castInValue(value, property, rcm, context, lang) {
  let result = [];
  if (!Array.isArray(value)) {
    value = [value];
  }
  value.forEach(v => result.push(toScalar(v, context, vt(rcm, property), lang)));
  return result;
}

/**
 * @param {{}} condition
 * @param {ClassMeta} rcm
 * @param {Item} context
 * @param {String} lang
 * @returns {{} | null}
 */
function ConditionParser(condition, rcm, context, lang) {
  var result, tmp;
  if (Array.isArray(condition)) {
    tmp = produceArray(condition, rcm, context, lang);
    if (tmp) {
      return {$and: tmp};
    }
  } else {
    if (condition.property) {
      result = {};
      switch (parseInt(condition.operation)) {
        case ConditionTypes.EMPTY: {
          result[condition.property] = {$empty: true};
        } break;
        case ConditionTypes.NOT_EMPTY: {
          result[condition.property] = {$empty: false};
        } break;
        case ConditionTypes.CONTAINS: result[condition.property] = produceContainsFilter(rcm, condition, context, lang);
          break;
        case ConditionTypes.EQUAL:
          result[condition.property] = produceFilter(condition, '$eq', rcm, context, lang); break;
        case ConditionTypes.NOT_EQUAL:
          result[condition.property] = produceFilter(condition, '$ne', rcm, context, lang); break;
        case ConditionTypes.LESS:
          result[condition.property] = produceFilter(condition, '$lt', rcm, context, lang); break;
        case ConditionTypes.MORE:
          result[condition.property] = produceFilter(condition, '$gt', rcm, context, lang); break;
        case ConditionTypes.LESS_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$lte', rcm, context, lang); break;
        case ConditionTypes.MORE_OR_EQUAL:
          result[condition.property] = produceFilter(condition, '$gte', rcm, context, lang); break;
        case ConditionTypes.LIKE: result[condition.property] = {
            $regex: String(toScalar(condition.value, context, PropertyTypes.STRING, lang))
              .replace(/[\[\]\.\*\(\)\\\/\?\+\$\^]/g, '\\$&')
              .replace(/\s+/g, '\\s+'),
            $options: 'i'
          }; break;
        case ConditionTypes.IN:
          result[condition.property] = {
            $in: castInValue(condition.value, condition.property, rcm, context, lang)
          }; break;
      }
      if (result.hasOwnProperty(condition.property)) {
        return result;
      }
    } else {
      if (BoolOpers.indexOf(condition.operation) !== -1) {
        tmp = produceArray(condition.nestedConditions, rcm, context, lang);
        if (tmp) {
          if (tmp.length > 1) {
            result = {};
            switch (condition.operation) {
              case OperationTypes.AND:
                result.$and = tmp;
                break;
              case OperationTypes.OR:
                result.$or = tmp;
                break;
              case OperationTypes.NOT:
                result.$not = {$and: tmp};
                break;
            }
          } else {
            switch (condition.operation) {
              case OperationTypes.AND:
              case OperationTypes.OR:
                result = tmp[0];
                break;
              case OperationTypes.NOT:
                result = {$not: tmp[0]};
                break;
            }
          }
          return result;
        }
      } else if (AgregOpers.indexOf(condition.operation) !== -1) {
        tmp =  produceAggregationOperation(condition, rcm, context, lang);
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
      } else if (Funcs.indexOf(condition.operation) !== -1) {
        result = {};
        switch (condition.operation) {
          case OperationTypes.DATE:
            result.$date = toScalar(condition.value, context, PropertyTypes.STRING, lang); break;
          case OperationTypes.DATEADD:
            result.$dateAdd = toScalar(condition.value, context, PropertyTypes.STRING, lang); break;
        }
        return result;
      }
    }
  }
  return null;
}

module.exports = ConditionParser;
