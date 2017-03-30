/**
 * Created by kras on 03.11.16.
 */
'use strict';

// jshint maxstatements: 50, maxcomplexity: 20
function passValue(v) {
  return Promise.resolve(v);
}

function argCalc(context, args, argCount, sync) {
  let calc = [];
  let tmp;
  let n = argCount ? (args.length > argCount ? argCount : args.length) : args.length;
  for (let i = 0; i < n; i++) {
    tmp = typeof args[i] === 'function' ? args[i].apply(context, [sync]) : args[i];
    calc.push(tmp);
  }
  return calc;
}

function argCalcPromise(context, args, argCount) {
  let calc = argCalc(context, args, argCount);
  let promises = [];
  for (let i = 0; i < calc.length; i++) {
    promises.push(calc[i] instanceof Promise ? calc[i] : passValue(calc[i]));
  }
  return Promise.all(promises);
}

function argCalcSync(context, args, argCount) {
  return argCalc(context, args, argCount, true);
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
  if (!args.length) {
    return new Promise(function (r) {r(false);});
  }
  for (var i = 0; i < args.length; i++) {
    if (!p) {
      p = seqPromiseConstructor(context, args[i]);
    } else {
      p = p.then(seqChain(context, args[i], interrupt));
    }
  }
  return p;
}

module.exports.argCalcPromise = argCalcPromise;
module.exports.argCalcSync = argCalcSync;
module.exports.argCalcChain = sequence;
