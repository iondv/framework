'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  return function (view, relativeTo = null, strict = false) {
    let paths = app.get('views');
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    for (let i = 0; i  < paths.length; i++) {
      let fn = path.join(paths[i], view + '.ejs');
      if (fs.existsSync(fn)) {
        if (relativeTo) {
          if (!fs.statSync(relativeTo).isDirectory()) {
            relativeTo = path.dirname(relativeTo);
          }
          let p = path.relative(relativeTo, fn);
          if (strict) {
            if (fs.existsSync(p)) {
              return p;
            }
          } else {
            return p;
          }
        }
        return fn;
      }
    }
    return strict ? false : view;
  };
};
