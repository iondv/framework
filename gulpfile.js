'use strict';

const gulp = require('gulp');
const assert = require('assert');
const nodePath = process.env.NODE_PATH.toLowerCase();

assert.ok(process.env.NODE_PATH,
  '\x1b[93;41mДолжна быть задана NODE_PATH c путем к дирректории запуска приложения:\x1b[0m ' + __dirname.toLowerCase());

assert.notEqual(nodePath.indexOf(__dirname.toLowerCase()), -1,
  '\x1b[93;41mNODE_PATH должна содержать путь к дирректории запуска приложения.\x1b[0m\nСейчас:           ' +
             nodePath + '\nДолжна содержать: ' + __dirname.toLowerCase());
global.devBuild = process.env.NODE_ENV !== 'production';

require('./gulp/build'); // Таски компоновки проекта и модулей
require('./gulp/json-schema'); // Таски на валидацию меты

gulp.task('default', ['build'], function (done) {
  done();
});

