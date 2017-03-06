/**
 * Created by krasilneg on 15.02.17.
 */
'use strict';

const resolvePath = require('core/resolvePath');

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
      result.push(resolvePath(cv));
    });
    app.set('views', result);
  }
};
