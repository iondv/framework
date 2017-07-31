'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const merge = require('merge');

function processDir(dir, filter, handler, onErr) {
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

function readConfigFiles(dir) {
  try {
    let promises = [];
    let files = {};
    processDir(
      dir,
      nm => ['.json', '.yml'].indexOf(path.extname(nm)) > -1,
      fn => {
        let ext = path.extname(fn);
        let fname = path.basename(fn, ext);
        if (!files[fname]) {
          files[fname] = {};
        }
        files[fname][ext] = fn;
      }
    );
    Object.keys(files).forEach(fname => {
      promises.push(new Promise(function (resolve, reject) {
        let yamlCfg = files[fname]['.yml'];
        let jsonCfg = files[fname]['.json'];
        let readers = [];
        if (yamlCfg) {
          readers.push(
            readYAML(yamlCfg)
            .catch(e => reject(new Error(`Не удалось прочитать содержимое файла ${yamlCfg}`)))
          );
        } else {
          readers.push(Promise.resolve({}));
        }
        if (jsonCfg) {
          readers.push(
            readJSON(jsonCfg)
            .catch(e => reject(new Error(`Не удалось прочитать содержимое файла ${jsonCfg}`)))
          );
        } else {
          readers.push(Promise.resolve({}));
        }
        Promise.all(readers)
          .then(data => resolve(merge(data[0], data[1])))
          .catch(e => reject(new Error(`Не удалось получить конфигурацию ${fname}`)));
      }));
    });
    return Promise.all(promises);
  } catch (err) {
    return Promise.reject(err);
  }
}
module.exports.readConfigFiles = readConfigFiles;
