/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 1/16/17.
 */
const express = require('express');
const resolvePath = require('core/resolvePath');

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
        router.use(
          (name[0] === '/' ? '' : '/') + name,
          express.static(resolvePath(statics[name]))
        );
        if (!result) {
          result = router;
        }
      }
    }
  }
  return result;
};
