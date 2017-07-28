'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

module.exports.processDir = function processDir(dir, filter, handler, onErr) {
  try {
    fs.accessSync(dir, fs.constants.F_OK);
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      let fn = path.join(dir, files[i]);
      let stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        processDir(fn, filter, handler);
      } else if (filter(files[i])) {
        handler(fn);
      }
    }
  } catch (e) {
    if (onErr) {
      onErr(e);
    } else {
      throw e;
    }
  }
};

module.exports.readFile = function readFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });

};

module.exports.readYAML = function readYAML(filePath) {
  return readFile(filePath).then(data => yaml.safeLoad(data, 'utf-8'));
};

module.exports.readJSON = function readJSON(filePath) {
  return readFile(filePath).then(data => JSON.parse(data));
};

module.exports.readConfigFiles = function readConfigFiles(dir) {
  return new Promise(function (resolve, reject) {
    let promises = [];
    let files = {};
    processDir(
      dir,
      nm => ['.json', '.yml'].indexOf(path.extname(nm)) > -1,
      fn => {
        let ext = path.extname(nm);
        let fname = path.basename(fn, ext);
        if (!files[fname]) {
          files[fname] = {};
        }
        files[fname][ext];
      },
      reject
    );
    Object.keys(files).forEach(fn => {

    });
  });
};
