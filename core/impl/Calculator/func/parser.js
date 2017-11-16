'use strict';
const {DataRepository, Item} = require('core/interfaces/DataRepository');
const PropertyTypes = require('core/PropertyTypes');
const F = require('core/FunctionCodes');

// jshint maxstatements: 50, maxcomplexity: 20
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
function parseArgs(argsSrc, funcLib, warn, dataRepoGetter, byRefMask) {
  if (!argsSrc) {
    return [];
  }

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
          warn,
          dataRepoGetter,
          cbr && byRefMask.indexOf(i) >= 0
        )
      );
      commaPos = findComma(argsSrc, closeBracketPos + 1);
    } else if (commaPos > -1) {
      result.push(evaluate(argsSrc.substring(start, commaPos).trim(), funcLib, warn, dataRepoGetter, cbr && byRefMask.indexOf(i) >= 0));
    } else {
      result.push(evaluate(argsSrc.substring(start).trim(), funcLib, warn, dataRepoGetter, cbr && byRefMask.indexOf(i) >= 0));
    }
    start = commaPos + 1;
    i++;
  } while (commaPos > -1);
  return result;
}

function objProp(obj, nm, dataRepoGetter) {
  if (!nm) {
    return null;
  }

  if (nm.indexOf('.') < 0) {
    if (obj.hasOwnProperty(nm)) {
      return obj[nm];
    }
  } else {
    let pth = nm.split('.');
    let ctx = obj;
    for (let i = 0; i < pth.length; i++) {
      if (ctx.hasOwnProperty(pth[i])) {
        ctx = ctx[pth[i]];
        if (typeof ctx !== 'object' || !ctx) {
          return ctx;
        }
      }
    }
  }

  if (obj.$context) {
    return objProp(obj.$context, nm, dataRepoGetter);
  }

  if (obj instanceof Item) {
    if (nm.indexOf('.') > 0) {
      let nm2 = nm.substr(0, nm.indexOf('.'));
      let nm3 = nm.substr(nm.indexOf('.') + 1);
      let ri = objProp(obj, nm2, dataRepoGetter);
      let rp = ri instanceof Promise? ri : Promise.resolve(ri);
      return rp.then((ri) => {
        if (ri instanceof Item) {
          return objProp(ri, nm3, dataRepoGetter);
        } else if (Array.isArray(ri)) {
          let result = [];
          let p = Promise.resolve();
          ri.forEach((ri) => {
            if (ri instanceof Item) {
              p = p.then(() => objProp(ri, nm3, dataRepoGetter))
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

    let p = obj.property(nm);
    if (p) {
     switch (p.meta.type) {
       case PropertyTypes.REFERENCE: {
         let v = p.evaluate();
         if ((p.getValue() || p.meta.backRef) && !v && typeof dataRepoGetter === 'function') {
           let dr = dataRepoGetter();
           if (dr instanceof DataRepository) {
             if (p.meta.backRef) {
               if (!obj.getItemId()) {
                 return null;
               }
               return dr.getList(p.meta._refClass.getCanonicalName(), {filter: {[F.EQUAL]: ['$' + p.meta.backRef, obj.getItemId()]}})
                 .then((items) => {
                   let item = items.length ? items[0] : null;
                   if (item) {
                     obj.references[p.getName()] = item;
                   }
                   return item;
                 });
             } else {
               return dr.getItem(p.meta._refClass.getCanonicalName(), p.getValue())
                 .then((item) => {
                   if (item) {
                     obj.references[p.getName()] = item;
                   }
                   return item;
                 });
             }
           }
         }
         return v;
       }break;
       case PropertyTypes.COLLECTION: {
         let v = p.evaluate();
         if (v === null && typeof dataRepoGetter === 'function' && obj.getItemId()) {
           let dr = dataRepoGetter();
           if (dr instanceof DataRepository) {
             return dr.getAssociationsList(obj, p.getName())
               .then((list) => {
                 obj.collections[p.getName()] = list;
                 return list;
               });
           }
         }
         return v;
       }break;
       default: return p.evaluate();
     }
    }
  }

  return null;
}

/**
 * @param {{name: String}} nm
 * @returns {Function}
 */
function propertyGetter(nm, dataRepoGetter) {
  return function () {
    return objProp(this, nm, dataRepoGetter);
  };
}

/**
 * @param {String} formula
 * @returns {*}
 */
function evaluate(formula, funcLib, warn, dataRepoGetter, byRef) {
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
      let args = parseArgs(formula.substring(pos + 1, formula.lastIndexOf(')')).trim(), funcLib, warn, dataRepoGetter, f.byRefMask);

      if (byRef) {
        return function () {return f(args);};
      }
      return funcLib[func](args);
    } else {
      warn('Не найдена функция ' + func);
    }
  }

  if (formula[0] === '$') {
    return propertyGetter(formula.substring(1), dataRepoGetter);
  }

  return formula;
}

function byRefConstructor(f, args) {
  return function () {return f(args);};
}

function parseObject(formula, funcLib, warn, dataRepoGetter, byRefMask, byRef) {
  /*if (!isNaN(formula)) {
    return Number(formula);
  }*/

  if (Array.isArray(formula)) {
    let result = [];
    let cbr = Array.isArray(byRefMask);
    formula.forEach((v, ind) => {
      result.push(parseObject(v, funcLib, warn, dataRepoGetter, null, cbr && byRefMask.indexOf(ind) >= 0));
    });
    return result;
  }

  if (formula === null || typeof formula !== 'object') {
    if (typeof formula === 'string') {
      if (formula[0] === '$') {
        return propertyGetter(formula.substring(1), dataRepoGetter);
      }
    }
    return formula;
  }

  for (let func in formula) {
    if (formula.hasOwnProperty(func)) {
      if (func[0] === '&') {
        func = func.substr(1);
        byRef = true;
      }
      if (funcLib.hasOwnProperty(func)) {
        let f = funcLib[func];
        let args = parseObject(formula[func], funcLib, warn, dataRepoGetter, f.byRefMask);
        if (byRef) {
          return byRefConstructor(f, args);
        }
        return f(args);
      } else {
        warn('Не найдена функция ' + func);
      }
    }
  }

  return formula;
}

module.exports = function (formula, lib, warn, dataRepoGetter) {
  let result = formula;
  if (typeof formula === 'string') {
    result = evaluate(formula.trim(), lib, warn, dataRepoGetter);
  } else if (formula && typeof formula === 'object' && !(formula instanceof Date)) {
    result = parseObject(formula, lib, warn, dataRepoGetter);
  }
  if (typeof result !== 'function') {
    return () => result;
  }
  return result;
};
