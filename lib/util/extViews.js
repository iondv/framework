/**
 * Created by krasilneg on 15.02.17.
 */
'use strict';

const path = require('path');

function realPath(p) {
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(__dirname, '../', p);
}

module.exports = function (app, views) {
  if (Array.isArray(views)) {
    var result = [];
    var current = app.get('views');
    if (typeof current === 'string') {
      result.push(current);
    } else if (Array.isArray(current)) {
      Array.prototype.push.apply(result, current);
    }

    views.forEach(function (cv) {
      result.push(realPath(cv));
    });
    app.set('views', result);
  }
};
