'use strict';

var gulp = require('gulp');

var childExec = require('./gulp-utilities').childExec;

/*
 Инициализируем базу данных
 */
gulp.task('init:db', function (done) {
  var saveNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development'; // Устанавливаем девелопмент окружение, чтобы иметь возможность сбрасывать базу данных при сборке, если заданао ION_INIT_DB=drop
  childExec('node', ['./bin/init-db'], {env: process.env}, (e) => {
    if (e) {
      console.error('Ошибка инициализации БД');
    }
    process.env.NODE_ENV = saveNodeEnv;
    done (e);
  });
});

/*
 Инициализируем загружаем классы меты из папки metadata
 */
gulp.task('init:meta', function (done) {
  childExec('node', ['./bin/init-meta'], (e) => {
    if (e) {
      console.error('Ошибка инициализации БД');
    }
    done (e);
  });
});

/*
 Инициализируем авторизацию
 */
gulp.task('init:auth', function (done) {
  childExec('node', ['./bin/init-auth'], (e) => {
    if (e) {
      console.error('Ошибка регистрации учетной записи администратора.');
    }
    done(e);
  });
});

// ################################################################################
// ##                Таски по работе с метой ION                                 ##
// ################################################################################
/**
 * Подготавливаем к инициализации меты модулей и тестов.
 * 2del - переделали в build:meta
 * /
 *
 var exec = require('child_process').exec;
 var baseName = require('path').basename;
 var join = require('path').join;
 var getDirAndFilesList = require('dir-and-files').getDirAndFilesList;
 var resolve = require('path').resolve;
 var assert = require('assert');
 var fs = require('fs');
 var config = require('../gulptask.conf.js');
 var confApp = require('../app/config');

gulp.task('init:metadata', ['init:meta'], function (done) {
  var qntMetaConfigsUpdated = 0;
  var qntMetaConfigToUpdate;
  function updateConfigFiles(folderOfMeta, callback) {
    getDirAndFilesList(join(config.path.meta, folderOfMeta, config.folder.config), {recurse: true,
          type: 'files',
          regexpFilesMask: new RegExp('.*[.](json$).*$', 'i')},
        function (err, confFilesList) {
          if (!confFilesList || !confFilesList.files || !confFilesList.files.length) {// Если папок конфы нет - выходим
            if (err.message.indexOf('ENOENT') !== -1) {
              callback (null);
            } else {
              callback (err);
            }
          } else {
            var conf = {
              metaConf: [],
              appConf: []
            };
            for (var i = 0; i < confFilesList.files.length; i++) {
              console.log('Обновляем конфигурационный файл', baseName(confFilesList.files[i]));
              conf.metaConf[i] = require(confFilesList.files[i]);
              var confFileData = fs.readFileSync(join(config.path.app,
                  config.folder.config,
                  baseName(confFilesList.files[i])));
              conf.appConf[i] = JSON.parse(confFileData);
              for (var key in conf.metaConf[i]) {
                if (conf.metaConf[i].hasOwnProperty(key)) {
                  conf.appConf[i][key] = conf.metaConf[i][key];
                }
              }
              fs.writeFileSync(join(config.path.app,
                  config.folder.config,
                  baseName(confFilesList.files[i])), JSON.stringify(conf.appConf[i], null, 2), 'utf8');
            }
            callback(null);
          }
        });
  }
  function checkUpdConfFiles(err) {
    assert.equal(err, null);
    qntMetaConfigsUpdated++;
    if (qntMetaConfigsUpdated === qntMetaConfigToUpdate) {
      console.log('Инициализировали мету');
      done();
    }
  }
  getDirAndFilesList(config.path.meta, {recurse: 0,
        type: 'dir'},
      function (err, metaList) {
        var folderOfMeta;
        if (!metaList || !metaList.dir || !metaList.dir.length) {// Если папок меты нет - выходим
          done(err);
        } else {
          qntMetaConfigToUpdate = metaList.dir.length;
          for (var i = 0; i < qntMetaConfigToUpdate; i++) {
            folderOfMeta = baseName(metaList.dir[i]);
            if (folderOfMeta === '.save-db') { // 2del - .save-db перенесена в .tmp
              qntMetaConfigsUpdated++;
              if (qntMetaConfigsUpdated === qntMetaConfigToUpdate) {
                console.log('Инициализировали мету');
                done();
              } else {
                continue;
              }
            }
            console.log('Обрабатываем метаданные:', folderOfMeta);
            // Копируем инициализирующие данные меты
            gulp.src(join(metaList.dir[i], config.folder.initdata, confApp.db, '** / *.json'))
                .pipe(gulp.dest(join(config.path.init, config.folder.initdata, confApp.db, 'meta', folderOfMeta)));
            // Копируем тесты меты
            gulp.src(join(metaList.dir[i], config.path.testE2E, '** / *.js'))
                .pipe(gulp.dest(join(config.path.testE2E, 'meta', folderOfMeta)));
            // Меняем конфигурационный файл, если задано в переменной окружения ION_INIT_META значение config
            if (process.env.ION_INIT_META && process.env.ION_INIT_META.indexOf('config') !== -1) {
              updateConfigFiles(folderOfMeta, checkUpdConfFiles);
            } else {
              qntMetaConfigsUpdated++;
              if (qntMetaConfigsUpdated === qntMetaConfigToUpdate) {
                console.log('Инициализировали мету');
                done();
              }
            }
          }

        }
      });
});*/
