/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/7/16.
 */
'use strict';
const path = require('path');

module.exports = function (p) {
  if (!path.isAbsolute(p)) {
    return path.normalize(path.join(__dirname, '..', p));
  }
  return p;
};
