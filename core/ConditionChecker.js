/**
 * Created by kras on 31.10.16.
 */
'use strict';

const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');
const PropertyTypes = require('core/PropertyTypes');
const equal = require('core/equal');
const cast = require('core/cast');
const Item = require('core/interfaces/DataRepository/lib/Item');
const strToDate = require('core/strToDate');

// jshint maxcomplexity: 50, maxstatements: 30, eqeqeq: false
function contains(container, content) {
  if (container && content !== null) {
    if (typeof container === 'string') {
      if (content) {
        return container.indexOf(String(content)) !== -1 ? true : false;
      }
    } else if (Array.isArray(container)) {
      return container.indexOf(content) >= 0 ? true : false;
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

function toArray(v, context, type, lang) {
  let result = [];
  if (!Array.isArray(v)) {
    v = [v];
  }
  for (let i = 0; i < v.length; i++) {
    let tmp = toScalar(v[i], context, type, lang);
    if (Array.isArray(tmp)) {
      Array.prototype.push.apply(result, tmp);
    } else {
      result.push(tmp);
    }
  }
  return result;
}

/**
 * @param {*} v
 * @param {{}} context
 * @param {Item} [context.$item]
 * @param {Number} type
 * @param {String} lang
 * @returns {*}
 */
function toScalar(v, context, type, lang) {
  if (Array.isArray(v)) {
    v = v[0];
  }

  if (typeof v === 'string' && v[0] === '$') {
    if (v === '$$now') {
      v = new Date();
    } else if (v === '$$today') {
      v = new Date();
      v.setHours(0, 0, 0, 0);
    } else if (context) {
      let item = context instanceof Item ? context : context.$item instanceof Item ? context.$item : null;
      let nm = v.substring(1);
      let p;
      if (item && (p = item.property(nm)) !== null) {
        v = p.getValue();
      } else if (context.hasOwnProperty(nm)) {
        v = context[nm];
      }
    }
    if (Array.isArray(v)) {
      let result = [];
      v.forEach((v) => {result.push(toScalar(v, context, type, lang));});
      return result;
    }
  }

  switch (type) {
    case PropertyTypes.DATETIME: {
      v = strToDate(v, lang);
      return v;
    }break;
    default: return cast(v, type);
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
 * @param {ClassMeta} cm
 * @param {String} property
 */
function vt(cm, property) {
  let pm = findPM(cm, property);
  if (pm) {
    if (pm.type === PropertyTypes.REFERENCE) {
      if (pm._refClass.getKeyProperties().length === 1) {
        return vt(pm._refClass, pm._refClass.getKeyProperties()[0]);
      }
      return PropertyTypes.STRING;
    }
    return pm.type;
  }
  return PropertyTypes.STRING;
}

function parseArgs(conditions, item, context, lang) {
  let result = [];
  conditions.forEach((c) => {
    result.push(checkCondition(item, c, context, lang));
  });
  return result;
}

function fDate(args) {
  return new Date(args[0] || null);
}

function fDateAdd(args) {
  let base = args[0] instanceof Date ? args[0] : new Date(args[0]);
  let unit = 'd';
  if (args.length > 2) {
    unit = args[2];
  }
  let interval = args[1];
  switch (unit) {
    case 'ms': base.setMilliseconds(base.getMilliseconds() + interval);break;
    case 's': base.setSeconds(base.getSeconds() + interval);break;
    case 'min': base.setMinutes(base.getMinutes() + interval);break;
    case 'h': base.setHours(base.getHours() + interval);break;
    case 'd': base.setDate(base.getDate() + interval);break;
    case 'm': base.setMonth(base.getMonth() + interval);break;
    case 'y': base.setYear(base.getYear() + interval);break;
    default: throw 'Передан некорректный тип интервала дат!';
  }
  return base;
}

function fDateDiff(args) {
  let d1 = args[0] instanceof Date ? args[0] : new Date(args[0]);
  let d2 = args[1] instanceof Date ? args[1] : new Date(args[1]);
  let unit = 'd';
  if (args.length > 2) {
    unit = args[2];
  }
  let result = 0;
  switch (unit) {
    case 'ms': result = d1.valueOf() - d2.valueOf();break;
    case 's': result = (d1.valueOf() - d2.valueOf()) / 1000;break;
    case 'min': result = (d1.valueOf() - d2.valueOf()) / 60000;break;
    case 'h': result = (d1.valueOf() - d2.valueOf()) / 3600000;break;
    case 'd': result = (d1.valueOf() - d2.valueOf()) / 86400000;break;
    case 'm': result = (d1.getYear() - 1) * 12 + d1.getMonth() - 1 + d1.getDate() / 31 -
                        ((d2.getYear() - 1) * 12 + d2.getMonth() - 1) - d2.getDate() / 31;break;
    case 'y': result = d1.getYear() - 1 + (d1.getMonth() - 1) / 12 + d1.getDate() /31 -
      (d2.getYear() - 1 + (d2.getMonth() - 1) / 12 + d2.getDate() /31);break;
    default: throw 'Передан некорректный тип интервала дат!';
  }

  let floor = false;
  if (args.length > 3) {
    floor = args[3];
  }

  if (floor) {
    return Math.floor(result);
  }
  return result;
}

function fAdd(args) {
  let result = 0;
  args.forEach((a) => {
    result += a;
  });
  return result;
}

function fSub(args) {
  let result = args[0];
  args.forEach((a, ind) => {
    if (ind > 0) {
      result -= a;
    }
  });
  return result;
}

function fMul(args) {
  let result = 1;
  args.forEach((a) => {
    result *= a;
  });
  return result;
}

function fDiv(args) {
  let result = args[0];
  args.forEach((a, ind) => {
    if (ind > 0) {
      result /= a;
    }
  });
  return result;
}

function fMod(args) {
  let result = args[0];
  args.forEach((a, ind) => {
    if (ind > 0) {
      result %= a;
    }
  });
  return result;
}

function rightArg(condition, item, context, t, lang) {
  if (condition.value && condition.value.length) {
    return toScalar(condition.value, context, t, lang);
  }
  if (condition.nestedConditions && condition.nestedConditions.length) {
    return checkCondition(item, condition.nestedConditions[0], context, lang);
  }
  return null;
}


/**
 * @param {Item} item
 * @param {{}} condition
 * @param {{}} context
 * @param {Item} [context.$item]
 * @returns {Boolean}
 */
function checkCondition(item, condition, context, lang) {
  if (condition.property) {
    let pn = condition.property;
    let p = item.property(pn);
    let t = vt(item.getMetaClass(), pn);
    if (!p) {
      throw new Error('Не найден указанный в условии атрибут ' + item.getClassName() + '.' + pn);
    }
    if (condition.operation === null) {
      return p.getValue();
    }

    switch (condition.operation) {
      case ConditionTypes.EQUAL:
        return equal(p.getValue(), rightArg(condition, item, context, t, lang));
      case ConditionTypes.NOT_EQUAL:
        return !equal(p.getValue(), rightArg(condition, item, context, t, lang));
      case ConditionTypes.EMPTY:
      {
        let v = p.evaluate() || item.get(pn);
        if (Array.isArray(v)) {
          return v.length === 0;
        }
        return v === null || v === '' || typeof v === 'undefined' ? true : false;
      }
        break;
      case ConditionTypes.NOT_EMPTY:
      {
        let v = p.evaluate() || item.get(pn);
        if (Array.isArray(v)) {
          return v.length > 0;
        }
        return v === null || v === '' || typeof v === 'undefined' ? false : true;
      }
        break;
      case ConditionTypes.LIKE:
        return String(p.getValue()).match(
          new RegExp(rightArg(condition, item, context, t, lang))
        ) ? true : false;
      case ConditionTypes.LESS:
        return p.getValue() < rightArg(condition, item, context, t, lang) ? true : false;
      case ConditionTypes.MORE:
        return p.getValue() > rightArg(condition, item, context, t, lang) ? true : false;
      case ConditionTypes.LESS_OR_EQUAL:
        return p.getValue() <= rightArg(condition, item, context, t, lang) ? true : false;
      case ConditionTypes.MORE_OR_EQUAL:
        return p.getValue() >= rightArg(condition, item, context, t, lang) ? true : false;
      case ConditionTypes.IN:
        return contains(toArray(condition.value, context, t, lang), p.getValue());
      case ConditionTypes.CONTAINS:
      {
        if (p.getType() === PropertyTypes.COLLECTION) {
          return colContains(p.evaluate(), condition.nestedConditions);
        } else {
          return contains(p.getValue(), rightArg(condition, item, context, t, lang));
        }
      }
    }
  } else if (condition.nestedConditions) {
    switch (condition.operation) {
      case OperationTypes.AND: return conjunct(item, condition.nestedConditions, context, lang);
      case OperationTypes.OR: return disjunct(item, condition.nestedConditions, context, lang);
      case OperationTypes.NOT: return !conjunct(item, condition.nestedConditions, context, lang);

      case OperationTypes.DATE:
        return fDate(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.DATEADD:
        return fDateAdd(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.DATEDIFF:
        return fDateDiff(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.ADD:
        return fAdd(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.SUB:
        return fSub(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.MUL:
        return fMul(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.DIV:
        return fDiv(parseArgs(condition.nestedConditions, item, context, lang));
      case OperationTypes.MOD:
        return fMod(parseArgs(condition.nestedConditions, item, context, lang));

    }
  } else if (condition.value) {
    return toScalar(condition.value, context, PropertyTypes.STRING, lang);
  }
  return false;
}

function conjunct(item, conditions, context, lang) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (!checkCondition(item, conditions[i], context, lang)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function disjunct(item, conditions, context, lang) {
  if (Array.isArray(conditions) && conditions.length) {
    for (var i = 0; i < conditions.length; i++) {
      if (checkCondition(item, conditions[i], context, lang)) {
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
module.exports = function (item, conditions, context, lang) {
  return conjunct(item, conditions, context || item, lang);
};
