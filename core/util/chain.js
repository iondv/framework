/**
 * Created by krasilneg on 24.01.17.
 */
'use strict';

function applier(s, worker){
  return function () {
    return worker(s);
  };
}

module.exports = function (seq, worker) {
  var p = null;
  if (!Array.isArray(seq)) {
    seq = [seq];
  }
  seq.forEach(function (s) {
    if (p) {
      p = applier(s, worker)();
    } else {
      p = p.then(applier(s, worker));
    }
  });
  if (p) {
    return p;
  }
  return Promise.resolve();
};
