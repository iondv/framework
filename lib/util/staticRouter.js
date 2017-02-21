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
  var result = null;
  if (statics) {
    for (var name in statics) {
      if (statics.hasOwnProperty(name)) {
        router.use(route(name), express.static(realPath(statics[name])));
        if (!result) {
          result = router;
        }
      }
    }
  }
  return result;
};
