/**
 * Created by kras on 03.11.16.
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

function seqPromiseConstructor(context, v) {
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

function seqChain(context, v, interrupt) {
  return function (result) {
    if (result === interrupt) {
      return new Promise(function (r) {r(result);});
    }
    return seqPromiseConstructor(context, v);
  };
}

function sequence(context, args, interrupt) {
  var p = null;
  if (!p.length) {
    return new Promise(function (r) {r(false);});
  }
  for (var i = 0; i < args.length; i++) {
    if (!p) {
      p = seqPromiseConstructor(context, args[i]);
    } else {
      p.then(seqChain(context, args[i], interrupt));
    }
  }
  return p;
}

module.exports.argCalcPromise = argCalcPromise;
module.exports.argCalcChain = sequence;
