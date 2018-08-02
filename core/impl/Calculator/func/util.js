/**
 * Created by kras on 03.11.16.
 */
'use strict';

// jshint maxstatements: 50, maxcomplexity: 20

function argCalc(context, args, argCount) {
  let calc = [];
  let n = argCount ? (args.length > argCount ? argCount : args.length) : args.length;
  let async = false;
  for (let i = 0; i < n; i++) {
    let tmp = null;
    if (Array.isArray(args[i])) {
      tmp = argCalc(context, args[i], null);
    } else if (typeof args[i] === 'function') {
      tmp = args[i].apply(context);
    } else {
      tmp = args[i];
    }

    async = tmp instanceof Promise ? true : async;
    calc.push(tmp);
  }
  if (async) {
    return Promise.all(calc);
  }
  return calc;
}

function seqPromiseConstructor(context, v) {
  let tmp;
  if (typeof v === 'function') {
    tmp = v.apply(context);
  }
  if (tmp instanceof Promise) {
    return tmp;
  }
  return Promise.resolve(tmp);
}

function seqChain(context, v, interrupt) {
  return function (result) {
    if (result === interrupt) {
      return Promise.resolve(interrupt);
    }
    return seqPromiseConstructor(context, v);
  };
}

function sequence(context, args, interrupt) {
  if (!args.length) {
    return false;
  }
  let ps = args.length;
  let p;
  let result;
  for (let i = 0; i < args.length; i++) {
    result = typeof args[i] === 'function' ? args[i].apply(context) : args[i];
    if (result instanceof Promise) {
      ps = i + 1;
      p = result;
      break;
    }
    if (result === interrupt) {
      return result;
    }
  }

  if (p) {
    for (let i = ps; i < args.length; i++) {
      p = p.then(seqChain(context, args[i], interrupt));
    }
    return p;
  }
  return result;
}

function worker(context, args, argLimit, cb) {
  let args2 = argCalc(context, args, argLimit);
  if (args2 instanceof Promise) {
    return args2.then(function (args) {
      try {
        return cb(args);
      } catch (e) {
        return Promise.reject(e);
      }
    });
  }
  return cb(args2);
}

module.exports.args = argCalc;
module.exports.sequenceCheck = sequence;
module.exports.calculate = worker;
