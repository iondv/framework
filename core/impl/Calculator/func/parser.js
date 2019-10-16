/* eslint no-invalid-this:off */
'use strict';
const {DataRepository, Item} = require('core/interfaces/DataRepository');
const PropertyTypes = require('core/PropertyTypes');
const F = require('core/FunctionCodes');
const Errors = require('core/errors/data-repo');
const merge = require('merge');

function findComma(src, start) {
  let pos = src.indexOf(',', start);

  if (pos > 0) {
    if (src[pos - 1] === '\'') {
      return findComma(src, pos + 1);
    }
  }
  return pos;
}

/**
 * @param {String} argsSrc
 * @returns {Array}
 */
function parseArgs(argsSrc, funcLib, dataRepoGetter, options) {
  if (!argsSrc) {
    return [];
  }

  let {byRefMask} = options;

  let i = 0;
  let result = [];
  let start = 0;
  let commaPos, openBracketPos, bp, open, closeBracketPos;
  let cbr = Array.isArray(byRefMask);

  do {
    commaPos = findComma(argsSrc, start);
    openBracketPos = argsSrc.indexOf('(', start);
    if (openBracketPos > -1 && openBracketPos < commaPos) {
      open = 1;
      bp = openBracketPos + 1;
      while (open > 0) {
        closeBracketPos = argsSrc.indexOf(')', bp);
        if (closeBracketPos < 0) {
          throw new Error('Formula syntax error in fragment "' + argsSrc + '".');
        }

        openBracketPos = argsSrc.indexOf('(', bp);

        if (closeBracketPos > -1 || openBracketPos > -1) {
          if (closeBracketPos > -1 && (closeBracketPos < openBracketPos || openBracketPos < 0)) {
            open--;
            bp = closeBracketPos + 1;
          }

          if (openBracketPos > -1 && closeBracketPos > openBracketPos) {
            open++;
            bp = openBracketPos + 1;
          }
        } else {
          throw new Error('syntax error in expression "' + argsSrc + '": bracket not closed');
        }
      }
      result.push(
        evaluate(
          argsSrc.substring(start, closeBracketPos + 1).trim(),
          funcLib,
          dataRepoGetter,
          merge(options, {byRef: cbr && byRefMask.indexOf(i) >= 0})
        )
      );
      commaPos = findComma(argsSrc, closeBracketPos + 1);
    } else if (commaPos > -1) {
      result.push(
        evaluate(
          argsSrc.substring(start, commaPos).trim(),
          funcLib,
          dataRepoGetter,
          merge(options, {byRef: cbr && byRefMask.indexOf(i) >= 0})
        )
      );
    } else {
      result.push(
        evaluate(
          argsSrc.substring(start).trim(),
          funcLib,
          dataRepoGetter,
          merge(options, {byRef: cbr && byRefMask.indexOf(i) >= 0})
        )
      );
    }
    start = commaPos + 1;
    i++;
  } while (commaPos > -1);
  return result;
}

function lazyLoader(obj, name, f) {
  if (!obj.__lazy_loaders) {
    obj.__lazy_loaders = {};
  }
  if (!obj.__lazy_loaders[name]) {
    obj.__lazy_loaders[name] = f()/*.then((r) => {delete obj.__lazy_loaders[name];return r;})*/;
  }
  return obj.__lazy_loaders[name];
}

/**
 * @param {mixed} obj
 * @param {String} nm
 * @param {function} dataRepoGetter
 * @param {{}} needed
 * @param {{lazyLoading: Boolean}} options
 * @returns {*}
 */
function objProp(obj, nm, dataRepoGetter, needed, options) {
  if (!nm) {
    return null;
  }

  if (obj instanceof Item) {
    if (nm.indexOf('.') > 0) {
      let nm2 = nm.substr(0, nm.indexOf('.'));
      let nm3 = nm.substr(nm.indexOf('.') + 1);
      let nm4 = nm3;
      if (nm4.indexOf('.') > 0) {
        nm4 = nm4.substr(0, nm.indexOf('.'));
      }
      let ri = objProp(obj, nm2, dataRepoGetter, {[nm4]: true}, options);
      let rp = ri instanceof Promise ? ri : Promise.resolve(ri);
      return rp.then((ri) => {
        if (ri instanceof Item) {
          return objProp(ri, nm3, dataRepoGetter, null, options);
        } else if (Array.isArray(ri)) {
          let result = [];
          let p = Promise.resolve();
          ri.forEach((ri) => {
            if (ri instanceof Item) {
              p = p
                .then(() => objProp(ri, nm3, dataRepoGetter, null, options))
                .then((v) => {
                  if (Array.isArray(v)) {
                    result.push(...v);
                  } else {
                    result.push(v);
                  }
                });
            }
          });
          return p.then(() => result);
        }
        return null;
      });
    }

    let getDisplayValue = false;
    if (nm[nm.length - 1] == '@') {
      getDisplayValue = true;
      nm = nm.substr(0, nm.length - 1);
    }
    let p = obj.property(nm);
    if (p) {
      if (getDisplayValue) {
        return p.getDisplayValue();
      }
      switch (p.meta.type) {
        case PropertyTypes.REFERENCE:
        {
          let v = p.evaluate();
          if (
            (p.getValue() || p.meta.backRef) && !v &&
            (options.lazyLoading !== false) && typeof dataRepoGetter === 'function'
          ) {
            let dr = dataRepoGetter();
            if (dr instanceof DataRepository) {
              if (p.meta.backRef) {
                if (!obj.getItemId()) {
                  return null;
                }
                return lazyLoader(obj, p.getName(),
                  () =>
                    dr.getList(
                      p.meta._refClass.getCanonicalName(),
                      {
                        filter: {[F.EQUAL]: ['$' + p.meta.backRef, obj.getItemId()]},
                        needed: needed || {},
                        lang: obj.getLang(),
                        tz: obj.tz
                      })
                      .then(items => items.length ? items[0] : null)
                );
              } else {
                return lazyLoader(
                  obj,
                  p.getName(),
                  () => dr.getItem(p.meta._refClass.getCanonicalName(), p.getValue(), {
                    needed: needed || {},
                    lang: obj.getLang(),
                    tz: obj.tz
                  })
                );
              }
            }
          }
          return v;
        }
        case PropertyTypes.COLLECTION: {
          let v = p.evaluate();
          if (
            v === null && (options.lazyLoading !== false) &&
            typeof dataRepoGetter === 'function' && obj.getItemId()
          ) {
            let dr = dataRepoGetter();
            if (dr instanceof DataRepository) {
              return lazyLoader(obj, p.getName(), () => dr.getAssociationsList(obj, p.getName(), {
                  needed: needed || {},
                  lang: obj.getLang(),
                  tz: obj.tz
                })
                .catch((err) => {
                  if (err.code === Errors.ITEM_NOT_FOUND) {
                    return null;
                  }
                  return Promise.reject(err);
                })
              );
            }
          }
          return v;
        }
        default: return p.evaluate();
      }
    }
  }

  if (nm.indexOf('.') < 0) {
    if (obj.hasOwnProperty(nm)) {
      return obj[nm];
    }
  } else {
    let pth = nm.split('.');
    if (obj.hasOwnProperty(pth[0])) {
      let ctx = obj[pth[0]];
      if (!ctx || typeof ctx !== 'object') {
        return ctx;
      }
      return objProp(ctx, pth.slice(1).join('.'), dataRepoGetter, needed, options);
    }
  }

  if (obj.$context) {
    return objProp(obj.$context, nm, dataRepoGetter, null, options);
  }

  return null;
}

/**
 * @param {{name: String}} nm
 * @returns {Function}
 */
function propertyGetter(nm, dataRepoGetter, options) {
  return function () {
    return objProp(this, nm, dataRepoGetter, null, options);
  };
}

/**
 * @param {String} formula
 * @returns {*}
 */
function evaluate(formula, funcLib, dataRepoGetter, options) {
  let {byRef} = options;
  if (!isNaN(formula)) {
    return Number(formula);
  }

  if (formula === 'null') {
    return null;
  }

  if (formula === 'true') {
    return true;
  }

  if (formula === 'false') {
    return false;
  }

  if (formula[0] === '\'' && formula[formula.length - 1] === '\'') {
    return formula.substring(1, formula.length - 1);
  }

  let pos;
  if ((pos = formula.indexOf('(')) > -1) {
    let func = formula.substring(0, pos).trim();
    if (func[0] === '&') {
      func = func.substr(1);
      byRef = true;
    }

    if (funcLib.hasOwnProperty(func)) {
      let f = funcLib[func];
      let closeBracketPos = formula.lastIndexOf(')');
      if (closeBracketPos < 0) {
        throw new Error('Formula syntax error in fragment "' + formula + '"');
      }
      let args = parseArgs(
        formula.substring(pos + 1, closeBracketPos).trim(),
        funcLib,
        dataRepoGetter,
        merge(options, {byRefMask: f.byRefMask})
      );

      if (byRef) {
        return function () {return f(args);};
      }
      return funcLib[func](args);
    } else {
      throw new Error('Function not found' + func);
    }
  }

  if (formula[0] === '$') {
    return propertyGetter(formula.substring(1), dataRepoGetter, options);
  }

  return formula;
}

function byRefConstructor(f, args) {
  return function () {return f(args);};
}

function parseObject(formula, funcLib, dataRepoGetter, options) {
  let {byRefMask, byRef} = options;
  /*
  If (!isNaN(formula)) {
    return Number(formula);
  }
  */

  if (Array.isArray(formula)) {
    let result = [];
    let cbr = Array.isArray(byRefMask);
    formula.forEach((v, ind) => {
      result.push(
        parseObject(
          v,
          funcLib,
          dataRepoGetter,
          merge(options, {byRefMask: null, byRef: cbr && byRefMask.indexOf(ind) >= 0})
        )
      );
    });
    return result;
  }

  if (formula === null || typeof formula !== 'object') {
    if (typeof formula === 'string') {
      if (formula[0] === '$') {
        return propertyGetter(formula.substring(1), dataRepoGetter, options);
      }
    }
    return formula;
  }

  let result = {};
  for (let func in formula) {
    if (formula.hasOwnProperty(func)) {
      let args = formula[func];
      if (func[0] === '&') {
        func = func.substr(1);
        byRef = true;
      }
      if (funcLib.hasOwnProperty(func)) {
        let f = funcLib[func];
        args = parseObject(args, funcLib, dataRepoGetter, merge(options, {byRefMask: f.byRefMask}));
        if (byRef) {
          return byRefConstructor(f, args);
        }
        return f(args);
      } else {
        result[func] = parseObject(args, funcLib, dataRepoGetter, options);
      }
    }
  }
  return result;
}

module.exports = function (formula, lib, dataRepoGetter, options) {
  let result = formula;
  if (typeof formula === 'string') {
    result = evaluate(formula.trim(), lib, dataRepoGetter, options || {});
  } else if (formula && typeof formula === 'object' && !(formula instanceof Date)) {
    result = parseObject(formula, lib, dataRepoGetter, options || {});
  }
  if (typeof result !== 'function') {
    return () => result;
  }
  return result;
};
