/* eslint no-sync:off */
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');

function merge(obj, other) {
  let result = _.mergeWith(obj, other, (objValue, srcValue) => {
    if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      return objValue.concat(srcValue);
    }
  });
  return result;
}

function processDir(dir, filter, handler, onErr) {
  try {
    fs.accessSync(dir, fs.constants.F_OK);
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      let fn = path.join(dir, files[i]);
      let stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        processDir(fn, filter, handler, onErr);
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
}
module.exports.processDir = processDir;

function readFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
module.exports.readFile = readFile;

function readYAML(filePath) {
  return readFile(filePath).then(data => yaml.safeLoad(data, 'utf-8'));
}
module.exports.readYAML = readYAML;

function readJSON(filePath) {
  return readFile(filePath).then(data => JSON.parse(data));
}
module.exports.readJSON = readJSON;

function processDirAsync(dir) {
  return new Promise(function (resolve, reject) {
    fs.access(dir, fs.R_OK, function (err) {
      if (err) {
        return reject(err);
      }
      fs.readdir(dir, function (err, files) {
        if (err) {
          return reject(err);
        }
        return resolve(files.map(f => path.join(dir, f)));
      });
    });
  });
}
module.exports.processDirAsync = processDirAsync;

function readConfigFiles(filesList) {
  return new Promise(function (resolve, reject) {
    let result = {};
    let promises = [];
    let files = {};

    if (Array.isArray(filesList)) {
      filesList.forEach((fn) => {
        let ext = path.extname(fn);
        if (['.json', '.yml'].indexOf(ext) > -1) {
          let fname = path.basename(fn, ext);
          if (!files[fname]) {
            files[fname] = {};
          }
          files[fname][ext] = fn;
        }
      });
    }

    Object.keys(files).forEach((fname) => {
      promises.push(new Promise((resolve, reject) => {
        let readers = [
          files[fname]['.yml'] ? readYAML(files[fname]['.yml']) : Promise.resolve({}),
          files[fname]['.json'] ? readJSON(files[fname]['.json']) : Promise.resolve({})
        ];
        Promise.all(readers)
          .then((data) => {
            result[fname] = merge(data[0], data[1]);
          })
          .then(resolve)
          .catch(e => reject(e));
      }));
    });
    return Promise.all(promises).then(() => resolve(result)).catch(reject);
  });
}
module.exports.readConfigFiles = readConfigFiles;

function access(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function readConfig(filePath) {
  let params = path.parse(filePath);
  let ymlFilePath = params.ext === '.yml' ? filePath : path.join(params.dir, params.name + '.yml');
  let jsonFilePath = params.ext === '.json' ? filePath : path.join(params.dir, params.name + '.json');
  let ymlFile = access(ymlFilePath) ? yaml.safeLoad(fs.readFileSync(ymlFilePath, 'utf-8'), 'utf-8') : {};
  let jsonFile = access(jsonFilePath) ? JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) : {};
  let result = merge(ymlFile, jsonFile);
  return result;
}
module.exports.readConfig = readConfig;

function readConfigAsync(filePath) {
  const params = path.parse(filePath);
  const ymlFilePath = params.ext === '.yml' ? filePath : path.join(params.dir, params.name + '.yml');
  const jsonFilePath = params.ext === '.json' ? filePath : path.join(params.dir, params.name + '.json');
  return new Promise((resolve, reject) => {
    fs.readFile(ymlFilePath, 'utf-8', (err, data) => {
      const ymlFile = err ? false : yaml.safeLoad(data);
      fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
        let jsonFile = false;
        if (err) {
          if (!ymlFile) {
            return reject(new Error(`Failed to read configuration from ${filePath}`));
          }
        } else {
          jsonFile = JSON.parse(data);
        }
        resolve(merge(ymlFile || {}, jsonFile || {}));
      });
    });
  });
}

module.exports.readConfigAsync = readConfigAsync;
