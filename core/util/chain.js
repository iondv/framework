/**
 * Created by krasilneg on 24.01.17.
 */
'use strict';

function applier(s, worker) {
  return function () {
    return worker(s);
  };
}

module.exports = function (seq, worker) {
  var p = null;
  if (!Array.isArray(seq)) {
    seq = [seq];
  }
  try {
    seq.forEach(function (s) {
      if (p) {
        p = p.then(applier(s, worker));
      } else {
        p = applier(s, worker)();
      }
    });
  } catch (err) {
    return Promise.reject(err);
  }
  if (p) {
    return p;
  }
  return Promise.resolve();
};
