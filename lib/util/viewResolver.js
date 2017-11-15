'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  return function (view) {
    let paths = app.get('views');
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    for (let i = 0; i < paths.length; i++) {
      let fn = path.join(paths[i], view + '.ejs');
      if (fs.existsSync(fn)) {
        return fn;
      }
    }
    return view;
  };
};
