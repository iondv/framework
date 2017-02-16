/**
 * В файле config.js содержится информация о настройках соединения с базой данных,
 * а также настройки сессии.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const pr = require('ini');
const merge = require('merge');

/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties) {
  if (config) {
    var nm, i, result, tmp;
    result = null;
    if (typeof config === 'string') {
      tmp = config.replace(/\[\[([\w\.]+)\]\]/g, function (str, setting) {
          result = properties[setting];
          if (typeof result === 'undefined' && setting.indexOf('.') > 0) {
            var section = setting.substr(0, setting.indexOf('.'));
            var prop = setting.substr(setting.indexOf('.') + 1);
            if (properties.hasOwnProperty(section) && properties[section].hasOwnProperty(prop)) {
              result = properties[section][prop];
            }
          }
          if (typeof result === 'object' || Array.isArray(result)) {
            return '';
          } else {
            return result;
          }
        }
      );
      if (Array.isArray(result)) {
        return result;
      }

      if (tmp !== String(result)) {
        return tmp;
      } else {
        return result;
      }
    } else if (config instanceof Array) {
      result = [];
      for (i = 0; i < config.length; i++) {
        result.push(parametrize(config[i], properties));
      }
      return result;
    } else if (config instanceof Object) {
      result = {};
      for (nm in config) {
        if (config.hasOwnProperty(nm)) {
          result[nm] = parametrize(config[nm], properties);
        }
      }
      return result;
    }
  }
  return config;
}

function parse(config, iniDir) {
  var files, i;
  if (config.parametrised) {
    var props = {};
    files = fs.readdirSync(iniDir);
    for (i = 0; i < files.length; i++) {
      if (files[i].match(/\w+\.ini$/)) {
        props = merge(props, pr.parse(fs.readFileSync(path.join(iniDir, files[i]), 'utf-8')));
      }
    }
    config = parametrize(config, props);
  }
  return config;
}

module.exports = parse;
