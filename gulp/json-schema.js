'use strict';
const gulp = require('gulp');
const jsonSchema = require('gulp-json-schema');
const runSequence = require('run-sequence');
const path = require('path');
const join = path.join;

const pathSchema = './test/meta-schema';
const pathApplications = './applications/';

const schemaOptions = {
  emitError: false,
  verbose: true,
  banUnknownProperties: true,
  checkRecursive: true,
  schemas: [join(pathSchema, 'command.schema.json'), join(pathSchema, 'view-properties.schema.json')],
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
  return gulp.src([join(pathApplications, '*/meta/*.json')])
    .pipe(jsonSchema(join(pathSchema, 'class.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:view-create&item', function () {
  console.log('Проверяем мету представлений создания и изменения.');
  return gulp.src([join(pathApplications, '*/views/*/create.json'),
    join(pathApplications, '*/views/*/item.json')])
    .pipe(jsonSchema(join(pathSchema, 'view-createnitem.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:view-list', function () {
  console.log('Проверяем мету представлений списка.');
  return gulp.src([join(pathApplications, '*/views/*/list.json')])
    .pipe(jsonSchema(join(pathSchema, 'view-list.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:navigation-section', function () {
  console.log('Проверяем мету секций навигации.');
  return gulp.src([join(pathApplications, '*/navigation/*.section.json')])
    .pipe(jsonSchema(join(pathSchema, 'navigation-section.main.schema.json'), schemaOptions));
});

gulp.task('validate:meta:navigation-unit', function () {
  console.log('Проверяем мету узлов навигации.');
  return gulp.src([join(pathApplications, '*/navigation/*/*.json')])
    .pipe(jsonSchema(join(pathSchema, 'navigation-unit.main.schema.json'), schemaOptions));
});

