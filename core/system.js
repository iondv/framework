'use strict';
const path = require('path');

module.exports.toAbsolute = function (pth) {
  if (!path.isAbsolute(pth)) {
    return path.normalize(path.join(__dirname, '..', pth));
  }
  return pth;
};
