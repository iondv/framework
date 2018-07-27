'use strict';
const path = require('path');
const fs = require('fs');

module.exports.toAbsolute = function (pth) {
  if (!path.isAbsolute(pth)) {
    return path.normalize(path.join(__dirname, '..', pth));
  }
  return pth;
};

/**
 * @param {String} pth
 * @param {{}} params
 * @return {Promise}
 */
module.exports.readFile = function (pth, params) {
  return new Promise((resolve, reject) => {
    fs.readFile(pth, params, (err, file) => err ? reject(err) : resolve(file));
  });
};
