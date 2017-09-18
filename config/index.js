'use strict';

let path = require('path');
let read = require('lib/config-reader');
let {readConfig} = require('core/util/read');
let config = readConfig(path.join(__dirname, './config.json'));

module.exports = read(config, __dirname);

