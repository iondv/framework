/**
 * Created by kras on 02.11.16.
 */
'use strict';

// jshint maxstatements: 50, maxcomplexity: 20
function passValue(v) {
  var val = v;
  return new Promise(function (r) {r(val);});
}

function argCalcPromise(context, args, argCount) {
  var calc = [];
  var tmp;
  var n = argCount ? (args.length > argCount ? argCount : args.length) : args.length;
  for (var i = 0; i < n; i++) {
    if (typeof args[i] === 'function') {
      tmp = args[i].apply(context);
    }
    if (tmp instanceof Promise) {
      calc.push(tmp);
    } else {
      calc.push(passValue(tmp));
    }
  }
  return Promise.all(calc);
}

function seqPromiseConstructor(v) {
  return new Promise(function (resolve, reject) {
    var tmp;
    if (typeof v === 'function') {
      tmp = v.apply(context);
    }
    if (tmp instanceof Promise) {
      tmp.then(resolve).catch(reject);
    } else {
      resolve(tmp);
    }
  });
}

function seqChain(v, interrupt) {
  return function (result) {
    if (result === interrupt) {
      return new Promise(function (r) {r(result);});
    }
    return seqPromiseConstructor(v);
  };
}

function sequence(context, args, interrupt) {
  var p = null;
  if (!p.length) {
    return new Promise(function (r) {r(false);});
  }
  for (var i = 0; i < args.length; i++) {
    if (!p) {
      p = seqPromiseConstructor(args[i]);
    } else {
      p.then(seqChain(args[i], interrupt));
    }
  }
  return p;
}

const funcLib = {
  and: function (args) {
    return function () {
      return sequence(this, args, false);
    };
  },
  or: function (args) {
    return function () {
      return sequence(this, args, true);
    };
  },
  not: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args, 1).then(function (args) {
          var result = false;
          if (args.length === 1) {
            result = !args[0];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  lt: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args, 2).then(function (args) {
          var result = false;
          if (args.length === 2) {
            result = args[0] < args[1];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  gt: function (args) {
    return function () {
      return new Promise(function (resolve, reject) {
        argCalcPromise(args, 2).then(function (args) {
          var result = false;
          if (args.length === 2) {
            result = args[0] > args[1];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  lte: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args, 2).then(function (args) {
          var result = false;
          if (args.length === 2) {
            result = args[0] <= args[1];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  gte: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args).then(function (args) {
          var result = false;
          if (args.length === 2) {
            result = args[0] >= args[1];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  add: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
          argCalcPromise(_this, args).then(function (args) {
            var result = 0;
            for (var i = 0; i < args.length; i++) {
              result = result + args[i];
            }
            resolve(result);
          }).catch(reject);
        });
    };
  },
  mul: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args).then(function (args) {
          var result = 1;
          for (var i = 0; i < args.length; i++) {
            result = result * args[i];
          }
          resolve(result);
        }).catch(reject);
      });
    };
  },
  sub: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
          argCalcPromise(_this, args).then(function (args) {
            if (!args.length) {
              resolve(0);
            }
            var result = args[args.length - 1];
            for (var i = args.length - 2; i >= 0; i--) {
              result = result - args[i];
            }
            resolve(result);
          }).catch(reject);
        });
    };
  },
  div: function (args) {
    return function () {
      var _this = this;
      return new Promise(function (resolve, reject) {
        argCalcPromise(_this, args).then(function (args) {
          if (!args.length) {
            resolve(0);
          }
          try {
            var result = args[args.length - 1];
            for (var i = args.length - 2; i >= 0; i--) {
              result = result / args[i];
            }
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }).catch(reject);
      });
    };
  }
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
 * @param {ClassMeta} [cm]
 * @returns {Array}
 */
function parseArgs(argsSrc, cm) {
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
      result.push(evaluate(argsSrc.substring(start, closeBracketPos + 1).trim(), cm));
      commaPos = findComma(argsSrc, closeBracketPos + 1);
    } else if (commaPos > -1) {
      result.push(evaluate(argsSrc.substring(start, commaPos).trim(), cm));
    } else {
      result.push(evaluate(argsSrc.substring(start).trim(), cm));
    }
    start = commaPos + 1;
    i++;
  } while (commaPos > -1);
  return result;
}

/**
 * @param {{name: String}} nm
 * @returns {Function}
 */
function propertyGetter(nm) {
  return function () {
    return this.get(nm);
  };
}

/**
 * @param {String} formula
 * @returns {*}
 */
function evaluate(formula) {
  var func, args, pos, pm;

  if (!isNaN(formula)) {
    return Number(formula);
  }

  if (formula === 'true') {
    return true;
  }

  if (formula === 'false') {
    return false;
  }

  if ((pos = formula.indexOf('(')) > -1) {
    args = parseArgs(formula.substring(pos + 1, formula.lastIndexOf(')')).trim());
    func = formula.substring(0, pos).trim();

    if (funcLib.hasOwnProperty(func)) {
      return funcLib[func](args);
    }
  }

  if (formula[0] === '$') {
    return propertyGetter(formula.substring(1));
  }

  return formula;
}

module.exports = evaluate;
