'use strict';
const Item = require('core/interfaces/DataRepository').Item;

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
function parseArgs(argsSrc, funcLib, warn, byRefMask) {
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
          cbr && byRefMask.indexOf(i) >= 0
        )
      );
      commaPos = findComma(argsSrc, closeBracketPos + 1);
    } else if (commaPos > -1) {
      result.push(evaluate(argsSrc.substring(start, commaPos).trim(), funcLib, warn, cbr && byRefMask.indexOf(i) >= 0));
    } else {
      result.push(evaluate(argsSrc.substring(start).trim(), funcLib, warn, cbr && byRefMask.indexOf(i) >= 0));
    }
    start = commaPos + 1;
    i++;
  } while (commaPos > -1);
  return result;
}

function objProp(obj, nm) {
  if (!nm) {
    return null;
  }

  if (obj instanceof Item) {
    return obj.property(nm).evaluate();
  }

  if (nm.indexOf('.') < 0) {
    if (obj.hasOwnProperty(nm)) {
      return obj[nm];
    }

    if (obj.$context) {
      return objProp(obj.$context, nm);
    }
  }

  let pth = nm.split('.');
  let ctx = obj;
  for (let i = 0; i < pth.length; i++) {
    ctx = ctx[pth[i]];
    if (typeof ctx !== 'object' || !ctx) {
      return ctx;
    }
  }
  return ctx;
}

/**
 * @param {{name: String}} nm
 * @returns {Function}
 */
function propertyGetter(nm) {
  return function () {
    return objProp(this, nm);
  };
}

/**
 * @param {String} formula
 * @returns {*}
 */
function evaluate(formula, funcLib, warn, byRef) {
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
      let args = parseArgs(formula.substring(pos + 1, formula.lastIndexOf(')')).trim(), funcLib, warn, f.byRefMask);

      if (byRef) {
        return function () {return f(args);};
      }
      return funcLib[func](args);
    } else {
      warn('Не найдена функция ' + func);
    }
  }

  if (formula[0] === '$') {
    return propertyGetter(formula.substring(1));
  }

  return formula;
}

function byRefConstructor(f, args) {
  return function () {return f(args);};
}

function parseObject(formula, funcLib, warn, byRefMask, byRef) {
  /*if (!isNaN(formula)) {
    return Number(formula);
  }*/

  if (Array.isArray(formula)) {
    let result = [];
    let cbr = Array.isArray(byRefMask);
    formula.forEach((v, ind) => {
      result.push(parseObject(v, funcLib, warn, null, cbr && byRefMask.indexOf(ind) >= 0));
    });
    return result;
  }

  if (formula === null || typeof formula !== 'object') {
    if (typeof formula === 'string') {
      if (formula[0] === '$') {
        return propertyGetter(formula.substring(1));
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
        let args = parseObject(formula[func], funcLib, warn, f.byRefMask);
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

module.exports = function (formula, lib, warn) {
  let result = formula;
  if (typeof formula === 'string') {
    result = evaluate(formula.trim(), lib, warn);
  } else if (formula && typeof formula === 'object' && !(formula instanceof Date)) {
    result = parseObject(formula, lib, warn);
  }
  if (typeof result !== 'function') {
    return () => result;
  }
  return result;
};
