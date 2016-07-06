/**
 * В файле config.js содержится информация о настройках соединения с базой данных,
 * а также настройки сессии.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var pr = require('properties-reader')();

var config = require('./config.json');

var files, i;

/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties) {
  if (config) {
    var nm, type, s, i, result;
    if (typeof config === 'string') {
      return config.replace(/\[\[([\w\.]+)\]\]/, function (str, setting) {
        return properties.get(setting);
      });
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

if (config.parametrised) {
  files = fs.readdirSync(__dirname);
  for (i = 0; i < files.length; i++) {
    if (files[i].match(/\w+\.ini/)) {
      pr.append(path.join(__dirname, files[i]));
    }
  }

  config = parametrize(config, pr);
}

module.exports = config;

// Альтернатива писать все в одном файле, в этом или подключаемом файле
// вызов тогда 	config = require('./config')() как функциий выдавать из элементов:
// function(mode) {return config[mode || process.argv[2] || 'local'] || config.local;}

