/* eslint no-sync:off */
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');
const {promisify} = require('util');
const readdirPromise = promisify(fs.readdir);
const readFilePromise = promisify(fs.readFile);

function merge(obj, other) {
  let result = _.mergeWith(obj, other, (objValue, srcValue) => {
    if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      return objValue.concat(srcValue);
    }
  });
  return result;
}
module.exports.merge = merge;

function isConfig(fn) {
  return ['.json', '.yml'].includes(path.extname(fn));
}
module.exports.isConfig = isConfig;

function processDir(dir, filter, handler, onErr, recursive = true) {
  try {
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      const fn = path.join(dir, files[i]);
      const stat = fs.lstatSync(fn);
      if (stat.isDirectory() && recursive) {
        processDir(fn, filter, handler, onErr);
      } else if (filter(files[i])) {
        handler(fn, dir);
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
  return readFilePromise(filePath, 'utf8');
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

function processDirAsync(dir, filter) {
  return readdirPromise(dir)
    .then(files => filter ? files.filter(filter) : files)
    .then(files => files.map(f => path.join(dir, f)));
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
  return Promise.all([readYAML(ymlFilePath).catch(() => false), readJSON(jsonFilePath).catch(() => false)])
    .then((files) => {
      const [ymlConfig, jsonConfig] = files;
      if (!ymlConfig && !jsonConfig) {
        throw new Error(`Failed to read configuration from ${path.join(params.dir, params.name)}[.yml|.json]`);
      }
      return merge(ymlConfig || {}, jsonConfig || {});
    });
}
module.exports.readConfigAsync = readConfigAsync;
