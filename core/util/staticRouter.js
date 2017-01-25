/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 1/16/17.
 */
const path = require('path');
const express = require('express');

function realPath(p) {
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(__dirname, '../../', p);
}

function route(name) {
  if (path.isAbsolute(name)) {
    return name;
  }
  return '/' + name;
}

/**
 *
 * @param {{name: String, path: String}[]}statics
 * @return {*}
 */
module.exports = function (statics) {
  var router = express.Router();
  if (Array.isArray(statics) && statics.length) {
    for (var i = 0; i < statics.length; i++) {
      if (statics[i].name && statics[i].path) {
        router.use(route(statics[i].name), express.static(realPath(statics[i].path)));
      }
    }
  }
  return router;
};
