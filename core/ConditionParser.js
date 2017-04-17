/**
 * Created by Данил on 10.10.2016.
 */
'use strict';
// jshint maxstatements: 30

const PropertyTypes = require('core/PropertyTypes');
const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');
const Operations = require('core/DataRepoOperations');

const BoolOpers = [OperationTypes.AND, OperationTypes.OR, OperationTypes.NOT];
const AgregOpers = [
  OperationTypes.MIN, OperationTypes.MAX, OperationTypes.AVG,
  OperationTypes.SUM, OperationTypes.COUNT
];

// jshint maxstatements: 40, maxcomplexity: 50
/**
 * @param {*} v
 * @param {Item} [context]
 * @returns {*}
 */
function toScalar(v, context) {
  if (!Array.isArray(v)) {
    v = [v];
  }
  var result = v.slice(0);

  for (let i = 0; i < result.length; i++) {
    if (typeof result[i] === 'string' && result[i][0] === '$' && context) {
      let p;
      if ((p = context.property(result[i].substring(1))) !== null) {
        return p.getValue();
      }
    }
  }

  return result;
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
 * @param {Item} [context]
 */
function produceContainsFilter(rcm, condition, context) {
  var pm = findPM(rcm, condition.property);
  if (pm) {
    if (pm.type === PropertyTypes.COLLECTION && pm._refClass) {
      if (Array.isArray(condition.value) && condition.value.length) {
        return {
          [Operations.CONTAINS]: [
              condition.property,
              {[Operations.IN]: [pm._refClass.getKeyProperties()[0], condition.value]}
          ]
        };
      }
      return {
        [Operations.CONTAINS]: [
          condition.property,
          ConditionParser(condition.nestedConditions, pm._refClass, context)
        ]
      };
    } else if (pm.type === PropertyTypes.STRING && condition.value) {
      let tmp = toScalar(condition.value, context);
      return {[Operations.LIKE]: [condition.property, tmp[0]]};
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
  var args = [condition.property];
  if (condition.value) {
    args = args.concat(toScalar(condition.value, context));
  }

  if (Array.isArray(condition.nestedConditions) && condition.nestedConditions.length) {
    let tmp = ConditionParser(condition.nestedConditions[0], rcm, context);
    if (tmp) {
      args.push(tmp);
    }
  }
  return {[type]: args};
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
    an = 'class';
    av = rcm.getCanonicalName();
  } else {
    pn = condition.value[1];
    av = condition.value[0];
    an = 'class';
    if ((pm = findPM(rcm, condition.value[0])) !== null) {
      if (pm.type === PropertyTypes.COLLECTION) {
        an = 'collection';
      }
    }
  }
  var result = [an, av, pn];
  var filter = ConditionParser(condition.nestedConditions, rcm, context);
  if (!filter) {
    result.push(filter);
  }
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
  if (Array.isArray(condition)) {
    let tmp = produceArray(condition, rcm);
    if (tmp) {
      return {[Operations.AND]: tmp};
    }
    return null;
  } else {
    if (condition.property) {
      switch (parseInt(condition.operation)) {
        case ConditionTypes.EMPTY: return {[Operations.EMPTY]: ['$' + condition.property]};
        case ConditionTypes.NOT_EMPTY: return {[Operations.NOT_EMPTY]: ['$' + condition.property]};
        case ConditionTypes.CONTAINS: return produceContainsFilter(rcm, condition, context);
        case ConditionTypes.EQUAL: return produceFilter(condition, Operations.EQUAL, rcm, context);
        case ConditionTypes.NOT_EQUAL: return produceFilter(condition, Operations.NOT_EQUAL, rcm, context);
        case ConditionTypes.LESS: return produceFilter(condition, Operations.LESS, rcm, context);
        case ConditionTypes.MORE: return produceFilter(condition, Operations.MORE, rcm, context);
        case ConditionTypes.LESS_OR_EQUAL: return produceFilter(condition, Operations.LESS_OR_EQUAL, rcm, context);
        case ConditionTypes.MORE_OR_EQUAL: return produceFilter(condition, Operations.MORE_OR_EQUAL, rcm, context);
        case ConditionTypes.LIKE: return produceFilter(condition, Operations.LIKE, rcm, context);
          /*

          Result[condition.property] = {
            $regex: String(toScalar(condition.value, context))
              .replace(/[\[\]\.\*\(\)\\\/\?\+\$\^]/g, '\\$&')
              .replace(/\s+/g, '\\s+'),
            $options: 'i'
          }; break;

          */
        case ConditionTypes.IN: return produceFilter(condition, Operations.IN, rcm, context);
        default: throw new Error('Некорректный тип условия!');
      }
    } else {
      if (BoolOpers.indexOf(condition.operation) !== -1) {
        let tmp = produceArray(condition.nestedConditions, rcm, context);
        if (tmp) {
          switch (condition.operation) {
            case OperationTypes.AND: return {[Operations.AND]: tmp};
            case OperationTypes.OR: return {[Operations.OR]: tmp};
            case OperationTypes.NOT: return {[Operations.NOT]: tmp};
            default: throw new Error('Некорректный тип операции!');
          }
        } else {
          throw new Error('Не указаны аргументы операции!');
        }
      } else if (AgregOpers.indexOf(condition.operation) !== -1) {
        let tmp =  produceAggregationOperation(condition, rcm, context);
        if (tmp) {
          switch (condition.operation) {
            case OperationTypes.MIN: return {[Operations.MIN]: tmp};
            case OperationTypes.MAX: return {[Operations.MAX]: tmp};
            case OperationTypes.AVG: return {[Operations.AVG]: tmp};
            case OperationTypes.SUM: return {[Operations.SUM]: tmp};
            case OperationTypes.COUNT: return {[Operations.COUNT]: tmp};
            default: throw new Error('Некорректный тип операции!');
          }
        } else {
          throw new Error('Не указаны аргументы операции!');
        }
      } else {
        let tmp = [];
        if (Array.isArray(condition.value) && condition.value.length) {
          tmp = tmp.concat(toScalar(condition.value, context));
        }
        if (Array.isArray(condition.nestedConditions) && condition.nestedConditions.length) {
          tmp = tmp.concat(produceArray(condition.nestedConditions, rcm, context));
        }
        switch (condition.operation) {
          case OperationTypes.DATE: return {[Operations.DATE]: tmp};
          case OperationTypes.DATEADD: return {[Operations.DATEADD]: tmp};
          case OperationTypes.DATEDIFF: return {[Operations.DATEDIFF]: tmp};
          case OperationTypes.ADD: return {[Operations.ADD]: tmp};
          case OperationTypes.SUB: return {[Operations.SUB]: tmp};
          case OperationTypes.MUL: return {[Operations.MUL]: tmp};
          case OperationTypes.DIV: return {[Operations.DIV]: tmp};
          case OperationTypes.ROUND: return {[Operations.ROUND]: tmp};
          case OperationTypes.CONCAT: return {[Operations.CONCAT]: tmp};
          case OperationTypes.SUBSTR: return {[Operations.SUBSTR]: tmp};
          case OperationTypes.MOD: return {[Operations.MOD]: tmp};
          case OperationTypes.ABS: return {[Operations.ABS]: tmp};
          default: throw new Error('Некорректный тип операции!');
        }
      }
    }
  }
  throw new Error('Мета условий выборки не соответствует спецификации!');
}

module.exports = ConditionParser;
