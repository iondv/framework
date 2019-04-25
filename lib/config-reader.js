/**
 * В файле config.js содержится информация о настройках соединения с базой данных,
 * а также настройки сессии.
 */

/* eslint no-sync:off */

'use strict';

const fs = require('fs');
const path = require('path');
const pr = require('ini');
const merge = require('merge');
const clone = require('clone');
const {toAbsolute} = require('../core/system');

// jshint maxstatements: 30, maxcomplexity: 20
/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties) {
  if (config) {
    let result = null;
    if (typeof config === 'string') {
      let tmp = config.replace(
        /\[\[([\w.]+)\]\]/g,
        (str, setting) => {
          result = properties[setting];

          if (typeof result === 'undefined') {
            let envName = setting.replace(/\./g, '_').toUpperCase();
            if (properties.hasOwnProperty(envName)) {
              result = properties[envName];
            }
          }

          if (typeof result === 'undefined' && setting.indexOf('.') > 0) {
            let section = setting.substr(0, setting.indexOf('.'));
            let prop = setting.substr(setting.indexOf('.') + 1);
            if (properties.hasOwnProperty(section) && properties[section].hasOwnProperty(prop)) {
              result = properties[section][prop];
            }
          }

          if (typeof result === 'undefined') {
            result = null;
            return '';
          } else if (typeof result === 'object' || Array.isArray(result)) {
            return '';
          } else {
            if (result === 'true') {
              result = true;
            } else if (result === 'false') {
              result = false;
            } else if (typeof result !== 'boolean' && !isNaN(result) && result !== '') {
              result = Number(result);
            }
            return result;
          }
        }
      );
      if (Array.isArray(result)) {
        return result;
      }

      if (result === null && tmp === '') {
        return result;
      }

      if (tmp !== String(result)) {
        return tmp;
      } else {
        return result;
      }
    } else if (config instanceof Array) {
      result = [];
      for (let i = 0; i < config.length; i++) {
        if (!config[i]) {
          result.push(config[i]);
        } else {
          let r = parametrize(config[i], properties);
          if (r !== null) {
            result.push(r);
          }
        }
      }
      return result;
    } else if (config instanceof Object) {
      result = {};
      for (let nm in config) {
        if (config.hasOwnProperty(nm)) {
          let r = parametrize(config[nm], properties);
          if (r !== null) {
            result[nm] = parametrize(config[nm], properties);
          }
        }
      }
      return result;
    }
  }
  return config;
}

function processPaths(config) {
  if (typeof config === 'string') {
    if (config.substr(0, 7) === 'file://') {
      return toAbsolute(config.substr(7));
    }
  } else if (Array.isArray(config)) {
    for (let i = 0; i < config.length; i++) {
      config[i] = processPaths(config[i]);
    }
  } else if (config && typeof config === 'object') {
    for (let nm in config) {
      if (config.hasOwnProperty(nm)) {
        config[nm] = processPaths(config[nm]);
      }
    }
  }
  return config;
}

function parse(config, iniDirs, cb) {
  if (config.parametrised) {
    let props = clone(process.env);
    if (typeof iniDirs === 'string') {
      iniDirs = [iniDirs];
    }

    if (typeof cb == 'function') {
      let p = Promise.resolve();
      iniDirs.forEach((iniDir) => {
        p = p.then(() => new Promise(
          (resolve, reject) => {
            fs.readdir(iniDir, (err, files) => {
              if (err)
                return reject(err);
              let p2 = Promise.resolve();
              files.forEach((f) => {
                if (f.match(/\w+\.ini$/)) {
                  p2 = p2.then(() => new Promise((resolve, reject) => {
                    fs.readFile(path.join(iniDir, f), 'utf-8', (err, data) => {
                      if (err)
                        return reject(err);
                      props = merge(props, pr.parse(data));
                      resolve();
                    });
                  }));
                } else if (f.match(/\w+\.override\.json$/)) {
                  let override = require(path.join(iniDir, f));
                  merge.recursive(config, override);
                }
              });
              p2.then(resolve).catch(reject);
            });
          }
        ));
      });
      p.then(() => processPaths(parametrize(config, props))).then(config => cb(null, config)).catch(cb);
    } else {
      iniDirs.forEach(function (iniDir) {
        let files = fs.readdirSync(iniDir);
        for (let i = 0; i < files.length; i++) {
          if (files[i].match(/\w+\.ini$/)) {
            props = merge(props, pr.parse(fs.readFileSync(path.join(iniDir, files[i]), 'utf-8')));
          } else if (files[i].match(/\w+\.override\.json$/)) {
            let override = require(path.join(iniDir, files[i]));
            merge.recursive(config, override);
          }
        }
      });
      return processPaths(parametrize(config, props));
    }
  }
}

module.exports = parse;
