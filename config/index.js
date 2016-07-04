/**
 * В файле config.js содержится информация о настройках соединения с базой данных,
 * а также настройки сессии.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var pr = require('properties-reader')();

var config = require(path.join(__dirname, "config.json"));

var files, i;

/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties){
  if (config) {
    var nm, type, s;
    for (nm in config) {
      if (config.hasOwnProperty(nm)) {
        type = typeof config[nm];
        if (type === 'object') {
          parametrize(config[nm], properties);
        } else if (type === 'string') {
          s = config[nm];
          config[nm] = s.replace(/\[\[([\w\.]+)\]\]/,function(str,setting){
            return properties.get(setting);
          });
        }
      }
    }
    properties.get();
  }
}

if (config.parametrised) {
  files = fs.readdirSync(__dirname);
  for (i = 0; i < files.length; i++) {
    if (files[i].match(/\w+\.ini/)) {
      pr.append(path.join(__dirname, files[i]));
    }
  }

  parametrize(config, pr);
}

module.exports = config;

// Альтернатива писать все в одном файле, в этом или подключаемом файле
// вызов тогда 	config = require('./config')() как функциий выдавать из элементов:
// function(mode) {return config[mode || process.argv[2] || 'local'] || config.local;}

