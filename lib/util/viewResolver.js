'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  return function (view, relativeTo = null) {
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
          return path.relative(relativeTo, fn);
        }
        return fn;
      }
    }
    return view;
  };
};
