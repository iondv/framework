'use strict';

var gulp = require('gulp');
var assert = require('assert');
assert.ok(process.env.NODE_PATH,
          '\x1b[93;41mДолжна быть задана NODE_PATH c путем к дирректории запуска приложения:\x1b[0m ' + __dirname);
assert.notEqual(process.env.NODE_PATH.indexOf(__dirname), -1,
             '\x1b[93;41mNODE_PATH должна содержать путь к дирректории запуска приложения.\x1b[0m\nСейчас:           ' +
             process.env.NODE_PATH + '\nДолжна содержать: ' + __dirname);
global.devBuild = process.env.NODE_ENV !== 'production';

require('./gulp/build'); // Таски компоновки проекта и модулей

gulp.task('default', ['build'], function (done) {
  done();
});

