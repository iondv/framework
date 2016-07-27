/**
 * В файле config.js содержится информация о настройках соединения с базой данных,
 * а также настройки сессии.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var pr = require('properties-reader')();

var files, i;

/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties) {
  if (config) {
    var nm, i, result, tmp;
    if (typeof config === 'string') {
      tmp = config.replace(/\[\[([\w\.]+)\]\]/, function (str, setting) {
        result = properties.get(setting);
        return result;
      });

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
  if (config.parametrised) {
    files = fs.readdirSync(iniDir);
    for (i = 0; i < files.length; i++) {
      if (files[i].match(/\w+\.ini/)) {
        pr.append(path.join(iniDir, files[i]));
      }
    }
    config = parametrize(config, pr);
  }
  return config;
}

module.exports = parse;
