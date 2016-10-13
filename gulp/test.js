'use strict';

var config = require('../gulptask.conf.js');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var join = require('path').join;
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

var jsTestList = [
  join(config.path.core, '**/*.js'),
  join(config.path.lib, '**/*.js')
]; // Список файлов для тестирования

/**
 * Базовый таск на тестирование всего и вся
 */
gulp.task('test', function (done) {
  runSequence(['test:jshint'],
               ['test:jscs'], function () {
    done();
  });
});

/**
 * Тестируем код на предмет возможных пропущенных ошибок и синтаксиса JS (jshint)
 */
gulp.task('test:jshint', function () {
  return gulp.src(jsTestList)
    .pipe(jshint()) // Используется конфигурационный файл в корне поекта .jshintrc
    .pipe(jshint.reporter())
    .pipe(jshint.reporter('fail'));
});

/**
 * Тестируем код на предмет синтаксиса JS (jscs)
 */
gulp.task('test:jscs', function () {
  return gulp.src(jsTestList)
    .pipe(jscs()) // Используется конфигурационный файл в в корне поекта .jscsrc
    // Если исправлять ошибки, то .pipe(jscs({fix: true}))
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'));
  // Дирректория для автом. исправления ошибок.pipe(gulp.dest('src'));
});
