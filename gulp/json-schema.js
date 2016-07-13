'use strict';
var config = require('../gulptask.conf.js');
var gulp = require('gulp');
var jsonSchema = require('gulp-json-schema');
var runSequence = require('run-sequence');
var path = require('path');
var join = path.join;

var schemaOptions = {
  emitError: false,
  verbose: true,
  banUnknownProperties: true,
  checkRecursive: true,
  schemas: [join(config.path.schema, 'command.schema.json'), join(config.path.schema, 'view-properties.schema.json')],
  missing: 'error'};
/* параметры валидации: https://www.npmjs.com/package/gulp-json-schema#options,
 относительно schemas, возможно имеет смысл вложеные схемы перетащить в отдельную папку и дергать ее целиком,
 пока не стала раскапывать варианты "как это сделать" */

gulp.task('validate:meta', function (done) { // Без runSequence вывод сваливается в кучу, последовательно удобнее
    runSequence(
      ['validate:meta:class'],
      ['validate:meta:view-create&item'],
      ['validate:meta:view-list'],
      ['validate:meta:navigation-section'],
      ['validate:meta:navigation-unit'],
      function () {
      done();
    });
  });

gulp.task('validate:meta:class', function () {
  console.log('Проверяем мету классов.');
  return gulp.src([join(config.path.applications, '*/meta/*.json')])
    .pipe(jsonSchema(join(config.path.schema, 'class.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:view-create&item', function () {
  console.log('Проверяем мету представлений создания и изменения.');
  return gulp.src([join(config.path.applications, '*/views/*/create.json'),join(config.path.applications, '*/views/*/item.json')])
    .pipe(jsonSchema(join(config.path.schema, 'view-createnitem.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:view-list', function () {
  console.log('Проверяем мету представлений списка.');
  return gulp.src([join(config.path.applications, '*/views/*/list.json')])
    .pipe(jsonSchema(join(config.path.schema, 'view-list.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:navigation-section', function () {
  console.log('Проверяем мету секций навигации.');
  return gulp.src([join(config.path.applications, '*/navigation/*.section.json')])
    .pipe(jsonSchema(join(config.path.schema, 'navigation-section.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:navigation-unit', function () {
  console.log('Проверяем мету узлов навигации.');
  return gulp.src([join(config.path.applications, '*/navigation/*/*.json')])
    .pipe(jsonSchema(join(config.path.schema, 'navigation-unit.main.schema.json'), schemaOptions));
});

