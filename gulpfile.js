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
require('./gulp/clean'); // Таски очистики папок, перед компоновокй
require('./gulp/copy.js'); // Таски копирования файлов и копирования вендорских (bower) файлов
require('./gulp/css.js'); // Таски работы с css
require('./gulp/init.js'); // Таски инициализации БД и меты
require('./gulp/distr.js'); // Таски подготовки дистрибутива
require('./gulp/docker.js'); // Таски подготовки для докера
require('./gulp/html.js'); // Таски работы с html
require('./gulp/images.js'); // Таски работы с картинками
require('./gulp/install.js'); // Таски установки компонентов node и bower
require('./gulp/js.js'); // Таски работы с JS для фронтенд
require('./gulp/test.js'); // Таски тестирования
require('./gulp/save.js'); // Сохранение БД

gulp.task('default', ['build'], function (done) {
  done();
});

