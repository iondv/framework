/**
 * Created by kras on 03.11.16.
 */
'use strict';

const ICalculator = require('core/interfaces/Calculator');
const stdLib = require('./func');
const clone = require('clone');
const aggreg = require('./func/aggreg');
const data = require('./func/data');
const Item = require('core/interfaces/DataRepository').Item;
const DataRepository = require('core/interfaces/DataRepository').DataRepository;

// jshint maxstatements: 50, maxcomplexity: 20
/**
 * @param {{}} options
 * @param {DataRepository | String} options.dataRepo
 * @param {Logger} [options.log]
 * @constructor
 */
function Calculator(options) {

  var funcLib = clone(stdLib);

  this.init = function (scope) {
    return new Promise(function (resolve) {
      var dataRepo = typeof options.dataRepo === 'string' ? scope[options.dataRepo] : options.dataRepo;
      if (dataRepo instanceof DataRepository) {
        funcLib.sum = aggreg.sum(dataRepo);
        funcLib.count = aggreg.count(dataRepo);
        funcLib.avg = aggreg.avg(dataRepo);
        funcLib.max = aggreg.max(dataRepo);
        funcLib.min = aggreg.min(dataRepo);
        funcLib.merge = aggreg.merge(dataRepo);
        funcLib.get = data.get(dataRepo);
      }
      resolve();
    });
  };

  function findComma(src, start) {
    var pos = src.indexOf(',', start);
    if (pos > 0) {
      if (src[pos - 1] === ',') {
        return findComma(src, pos + 1);
      }
    }
    return pos;
  }

  /**
   * @param {String} argsSrc
   * @returns {Array}
   */
  function parseArgs(argsSrc) {
    if (!argsSrc) {
      return [];
    }

    var i = 0;
    var result = [];
    var start = 0;
    var commaPos, openBracketPos, bp, open, closeBracketPos;

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
        result.push(evaluate(argsSrc.substring(start, closeBracketPos + 1).trim()));
        commaPos = findComma(argsSrc, closeBracketPos + 1);
      } else if (commaPos > -1) {
        result.push(evaluate(argsSrc.substring(start, commaPos).trim()));
      } else {
        result.push(evaluate(argsSrc.substring(start).trim()));
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

    var pth = nm.split('.');
    var ctx = obj;
    for (var i = 0; i < pth.length; i++) {
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

  function warn(msg) {
    var log = options.log || console;
    log.warn(msg);
  }

  /**
   * @param {String} formula
   * @returns {*}
   */
  function evaluate(formula) {
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
      let args = parseArgs(formula.substring(pos + 1, formula.lastIndexOf(')')).trim());
      let func = formula.substring(0, pos).trim();
      let byRef = false;
      if (func[0] === '&') {
        func = func.substr(1);
        byRef = true;
      }

      if (funcLib.hasOwnProperty(func)) {
        if (byRef) {
          return function () {return funcLib[func](args);};
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

  /**
   * @param {String} formula
   */
  this._parseFormula = function (formula) {
    var result = evaluate(formula.trim());
    if (typeof result !== 'function') {
      return () => result;
    }
    return result;
  };
}

Calculator.prototype = new ICalculator();

module.exports = Calculator;
