'use strict';

var gulp = require('gulp');
var assert = require('assert');
let nodePath = process.env.NODE_PATH.toLowerCase();
let dirName = __dirname.toLowerCase();

assert.ok(process.env.NODE_PATH,
          '\x1b[93;41mДолжна быть задана NODE_PATH c путем к дирректории запуска приложения:\x1b[0m ' + dirName);

assert.notEqual(nodePath.indexOf(dirName), -1,
             '\x1b[93;41mNODE_PATH должна содержать путь к дирректории запуска приложения.\x1b[0m\nСейчас:           ' +
             nodePath + '\nДолжна содержать: ' + dirName);
global.devBuild = process.env.NODE_ENV !== 'production';

require('./gulp/build'); // Таски компоновки проекта и модулей
require('./gulp/test'); // Таски тестирования проекта и модулей
require('./gulp/json-schema'); // Таски на валидацию меты

gulp.task('default', ['build'], function (done) {
  done();
});

