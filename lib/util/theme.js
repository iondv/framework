/**
 * Created by krasilneg on 15.02.17.
 */
const path = require('path');
const express = require('express');
const fs = require('fs');

function resolve(baseDir, pth) {
  var test;
  if (path.isAbsolute(pth)) {
    test = path.normalize(pth);
    if (fs.existsSync(test)) {
      return test;
    }
    return null;
  }
  test = path.normalize(path.join(baseDir, 'view', pth));
  if (fs.existsSync(test)) {
    return test;
  }
  test = path.normalize(path.join(__dirname, '..', '..', 'applications', pth));
  if (fs.existsSync(test)) {
    return test;
  }
  test = path.normalize(path.join(__dirname, '..', '..', pth));
  if (fs.existsSync(test)) {
    return test;
  }
  return null;
}

/**
 * @param {{}} app
 * @param {String} moduleName
 * @param {String} baseDir
 * @param {String} themePath
 * @param {Logger} [log]
 */
module.exports = function (app, moduleName, baseDir, themePath, log) {
  themePath = resolve(baseDir, themePath);
  if (!themePath) {
    throw new Error('Не найдена тема офрмления ' + themePath);
  } else {
    if (log) {
      log.info('Используется тема оформления из ' + themePath);
    }
    app.use('/' + moduleName, express.static(path.join(themePath, 'static')));
    var views = [path.join(themePath, 'templates')];
    var current = app.get('views');
    if (typeof current === 'string') {
      views.push(current);
    } else if (Array.isArray(current)) {
      Array.prototype.push.apply(views, current);
    }
    app.set('views', views);
  }
};
