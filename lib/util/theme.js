'use strict';
/**
 * Created by krasilneg on 15.02.17.
 */
const path = require('path');
const express = require('express');
const fs = require('fs');
const favicon = require('serve-favicon');
const {t} = require('core/i18n');
const {format} = require('util');

function resolve(baseDir, pth) {
  let test;
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
 * @param {{maxAge: Number}} options
 */
module.exports = function (app, moduleName, baseDir, themePath, log, options) {
  themePath = resolve(baseDir, themePath);
  if (!themePath) {
    throw new Error(format(t('Theme %s not found'), themePath));
  } else {
    if (log) {
      log.info(format(t('Using theme from %s'), themePath));
    }

    let statics = path.join(themePath, 'static');

    if (fs.existsSync(statics)) {
      app.use('/' + (moduleName || ''), express.static(statics, options));
    }

    let vendors = path.join(themePath, 'vendor');
    if (fs.existsSync(vendors)) {
      let pth = moduleName ? '/' + moduleName + '/vendor' : '/vendor';
      app.use(pth, express.static(vendors, options));
    }

    let favico = path.join(themePath, 'static', 'favicon.ico');
    if (fs.existsSync(favico)) {
      app.use(favicon(favico));
    }
    let views = [path.join(themePath, 'templates')];
    let current = app.get('views');
    if (typeof current === 'string') {
      views.push(current);
    } else if (Array.isArray(current)) {
      Array.prototype.push.apply(views, current);
    }
    app.set('views', views);
  }
};
module.exports.resolve = resolve;
