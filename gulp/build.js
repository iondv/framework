'use strict';

var xreq = require('xreq');
var gulp = require('gulp');
var runSequence = require('run-sequence').use(gulp);
var baseName = require('path').basename;
var config = xreq('gulptask.conf.js');
var getDirAndFilesList = require('dir-and-files').getDirAndFilesList;
var path = require('path');
var join = path.join;
var exec = require('child_process').exec;
var childExec = require('./gulp-utilities').childExec;
var winExt = /^win/.test(process.platform) ? '.cmd' : ''; // Расширение необходимо задавать при запуске childProccess

var assert = require('chai').assert;
var fs = require('fs');

/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
gulp.task('build', ['clean', 'install'], function (done) {
  runSequence(// FIXME 'npm:shrinkwrap',// не работает - конфликт в компонентах
    ['copy:devel', // Копируем фронтенд и бакэнд для сборки
    'copy:vendor'], // Копируем вендорские компоненты
    'build:modules', // Инициализируем модули - делаем после и отдельно от clean - т.к. попадает иначе под очистку
    'build:metadata', // Инициализируем мету - копируем данные для инициализации и тесты меты
    // FIXME Валит ошибку памяти - пока много ошибок  в коде. Тесты нужно выполнять последовательно
    // ['js:hint', 'js:cs'],
    ['css:compile'], // Убрали , 'js:compile' - т.к. неоднозначно как нужно собирать js файлы в один и везде ли нужно
    ['html', 'js:minify', 'images'],
    'init:db', // Инициализируем БД
    'init:meta', // Инициализируем мету, после БД - т.к. при инициализации БД может очищаться база данных
    'init:auth',
    // FIXME плохое покрытие кода-валит ошибки и тесты нужно выполнять последовательно['test:BE', 'test:ME', 'test:FE'],
    function () {
      console.log('Провели разработческую сборку приложения.');
      done();
    });
});

// ################################################################################
// ##                Таски по работе с модулями ION                              ##
// ################################################################################
gulp.task('build:modules', function (done) {
  var qntModuleToBuild;
  var qntModulesBuilded = 0;

  function endModuleBuild(folderOfModule) {
    console.log('Закончена сборка модуля', folderOfModule);
    qntModulesBuilded++;
    if (qntModulesBuilded === qntModuleToBuild) {
      console.log('Закончена сборка модулей');
      done();
    }
  }
  getDirAndFilesList(config.path._modules, {recurse: 0,
      type: 'dir'},
    function (err, modulesList) {
      console.log(modulesList);
      if (!modulesList || !modulesList.dir || !modulesList.dir.length) {// Если нет папок модулей - выходим
        done();
      } else {
        qntModuleToBuild = modulesList.dir.length;
        for (var i = 0; i < qntModuleToBuild; i++) {
          let packageModule;
          try {
            packageModule = require(join(modulesList.dir[i], 'package.json'));
          } catch (e) {
            packageModule = baseName(modulesList.dir[i]);
          }
          if (packageModule && packageModule.name !== baseName(modulesList.dir[i])) {
            console.warn(`Разница между названием модуля в packages.json ${packageModule.name} ` +
                          `и именем папки модуля ${baseName(modulesList.dir[i])}, возможны ошибки работы.`);
            console.warn(`Пропущена сборка модуля ${packageModule.name}, заголовок: "${packageModule.caption}". ` +
              `Устраниете расхождение с названием папки ${modulesList.dir[i]}`);
            continue;
          } else {
            moduleNPMInstall(packageModule.name)
              .then(moduleBowerInstall)
              .then(moduleVendorRelocate)
              .then(moduleCopyInitDate)
              .then(moduleCopyFrontends)
              .then(moduleCopyTemplates)
              .then(moduleCopyTests)
              .then(endModuleBuild)
              .catch(done);
          }
        }
      }
    });
});

/**
 * Установка пакетов модуля
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleNPMInstall(folderOfModule) {
  return new Promise(function (resolve, reject) {
    /* Попытка сделать ссылки(synlink) для node_modules в модулях на общую- делает кучу ошибок
    try { // Создаем ссылку на node_modules корня Системы, если указано в параметрах модуля ion.sharedNodeModules=true и папки ещё нет
      var pathModule = join(__dirname, '..', config.path._modules, folderOfModule);
      var modulePackage = require(pathModule + '/package.json');
      fs.statSync(pathModule + '/node_modules'); // Если дирректории или ссылка нет - выдаст ошибку
    } catch (e) { // Ошибка если дирректории нет, соответственно можно создать ссылку
      if (e.code === 'ENOENT' && modulePackage.ion && modulePackage.ion.sharedNodeModules) {
        try {
          fs.linkSync('../../node_modules', config.path._modules + '/' + folderOfModule + '/node_modules', 'dir');
          console.info('Создали ссылку на общий node_modules системы модуля', folderOfModule);
        } catch (e) {
          if (e.code === 'EPERM') {
            console.info('Не хватает прав для создания ссылки на общую node_mosules модуля', folderOfModule,
                         '\nОшибка', e.message);
          } else {
            console.info('Не удалось создать ссылку, используется собственный каталог node_mosules модуля', folderOfModule,
                          '\nОшибка', e.message);
          }
        }
      }
    }*/
    try {
      childExec('npm' + winExt, ['install', '--production'], {cwd: join(config.path._modules, folderOfModule)}, (e) => {
        if (e) {
          console.error('Ошибка установки пакетов модуля', folderOfModule);
          reject(e);
        } else {
          console.log('Установили пакеты модуля:', folderOfModule);
          resolve(folderOfModule);
        }
      });
    } catch (e) {
      console.error('Ошибка установки пакетов модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

/**
 * Установка пакетов bower модуля
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleBowerInstall(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      fs.statSync(join(config.path._modules, folderOfModule, 'bower.json')); // Если фацла нет - выдаст ошибку
      childExec('bower' + winExt, ['install', '--config.interactive=false'], //  --force --quiet --offline - офлайн ускоряет, но ваклит тестировани и сборку
                {cwd: join(config.path._modules, folderOfModule)},
        (e) => {
          if (e) {
            console.error('Ошибка установки пакетов bower модуля', folderOfModule);
            reject(e);
          } else {
            console.log('Установили пакеты bower модуля:', folderOfModule);
            resolve(folderOfModule);
          }
        });
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.warn('Отсутствует файл bower.json. Пропущена установка компонентов bower для модуля', folderOfModule);
        resolve(folderOfModule);
      } else {
        console.error('Ошибка установки bower модуля', folderOfModule + ':', e);
        reject(e);
      }
    }
  });
}

/**
 * Копирование вендорских пакетов для модуля
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleVendorRelocate(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      var vendorsDist = []; // Список модулей вендоров, у которых есть готовые модули в папке dist
      var vendorsFull = []; // Список модулей вендоров, у которых нет папки с дистрибутивом
      var vendorsException = { // Список исключений модулей, у которых нужно копировать спец. папки.
        names: ['moment'], // Должно быть соответствие модулям по индексам внутренних путей paths
        paths: ['min'] // (!)Только один уровень вложенности в исключениях
      };
      getDirAndFilesList(join(config.path._modules, folderOfModule, config.path._src, config.folder._vendor),
        {recurse: false, type: 'dir'},
        function (err, vendorsList) {
          try {
            assert.equal(err, null, 'При получении списка модулей bower возвращен код ошибки' + err);
            for (var i = 0; i < vendorsList.dir.length; i++) {
              try {
                var indexException = vendorsException.names.indexOf(path.basename(vendorsList.dir[i]));
                if (indexException >= 0) {
                  vendorsDist.push(fs.realpathSync(join(vendorsList.dir[i], vendorsException.paths[indexException])));
                } else {
                  vendorsDist.push(fs.realpathSync(join(vendorsList.dir[i], 'dist')));
                }
              } catch (e) {
                vendorsFull.push(join(vendorsList.dir[i], '**/*'));
              }
            }
            gulp.src(vendorsFull,
              {base: join(config.path._modules, folderOfModule, config.path._src, config.folder._vendor)})
              // Копируем вендоров с полными папками
              .pipe(gulp.dest(join(config.path._public, config.folder._vendor, folderOfModule)))
              .on('finish', function copySpecificVendors() {
                for (var i = 0; i < vendorsDist.length; i++) {
                  var curPublVendorPath = join(config.path._public,
                    config.folder._vendor, folderOfModule,
                    path.basename(path.dirname(vendorsDist[i])));
                  // Убираем dist или исключения и получем назв.модуля, копируем их
                  gulp.src(join(vendorsDist[i], '**/*'), {base: vendorsDist[i]})
                    .pipe(gulp.dest(curPublVendorPath));
                }
                console.log('Скопировали вендорские файлы для модуля:', folderOfModule);
                resolve(folderOfModule);
              });
          } catch (e) {
            if (e && e.toString().search('Error: ENOENT') >= 0) {
              resolve(folderOfModule);
            } else {
              reject (e);
            }
          }
        });

    } catch (e) {
      console.error('Ошибка копирования вендорских файлов модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем инициализирующие данные из init-data/[тип бд] в /app/init/init-data/[тип бд]/modules/[имя модуля]
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleCopyInitDate(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      var confApp = xreq.app('config');
      gulp.src(join(config.path._modules, folderOfModule, config.folder._initdata, confApp.db, '**/*'))
        .pipe(gulp.dest(join(config.path._init, config.folder._initdata, confApp.db, 'modules', folderOfModule)))
        .on('finish', function () {
          console.log('Скопировали файлы инициалиации БД для модуля:', folderOfModule);
          resolve(folderOfModule);
        });
    } catch (e) {
      console.error('Ошибка копирования файлов инициализации БД модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы фронтенда модуля в публик /public/[тип файлов]/[имя модуля]
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleCopyFrontends(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._modules, folderOfModule, config.path._srcFE, config.folder._fonts, '**/*'))
        .pipe(gulp.dest(join(config.path._public, config.folder._fonts, folderOfModule)))
        .on('finish', function () {
          gulp.src(join(config.path._modules, folderOfModule, config.path._srcFE, config.folder._js, '**/*'))
            .pipe(gulp.dest(join(config.path._public, config.folder._js, folderOfModule)))
            .on('finish', function () {
              gulp.src(join(config.path._modules, folderOfModule, config.path._srcFE, config.folder._css, '**/*'))
                .pipe(gulp.dest(join(config.path._public, config.folder._css, folderOfModule)))
                .on('finish', function () {
                  gulp.src(join(config.path._modules, folderOfModule, config.path._srcFE, config.folder._img, '**/*'))
                    .pipe(gulp.dest(join(config.path._public, config.folder._img, folderOfModule)))
                    .on('finish', function () {
                      gulp.src(join(config.path._modules, folderOfModule, config.path._srcFE, config.folder._html, '**/*'))
                        .pipe(gulp.dest(join(config.path._public, folderOfModule)))
                        .on('finish', function () {
                          console.log('Скопировали файлы фронтенд для модуля:', folderOfModule);
                          resolve(folderOfModule);
                        });
                    });
                });
            });
        });
    } catch (e) {
      console.error('Ошибка копирования файлов фронтенда модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы шаблонов модуля в private /private/[имя модуля]
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleCopyTemplates(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._modules, folderOfModule, config.path._src, config.folder._templates, '**/*'))
        .pipe(gulp.dest(join(config.path._private, config.folder._templates, folderOfModule)))
        .on('finish', function () {
          console.log('Скопировали шаблоны для модуля:', folderOfModule);
          resolve(folderOfModule);
        });
    } catch (e) {
      console.error('Ошибка копирования шаблонов модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы тестов модуля из ./test/[тип теста] в папку портала /test/[тип теста]/modules/[имя модуля]
 *
 * @param {String} folderOfModule - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function moduleCopyTests(folderOfModule) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._modules, folderOfModule, config.path._testBE, '**/*'))
        .pipe(gulp.dest(join(config.path._testBE, 'modules', folderOfModule)))
        .on('finish', function () {
          gulp.src(join(config.path._modules, folderOfModule, config.path._testME, '**/*'))
            .pipe(gulp.dest(join(config.path._testME, 'modules', folderOfModule)))
            .on('finish', function () {
              gulp.src(join(config.path._modules, folderOfModule, config.path._testFE, '**/*'))
                .pipe(gulp.dest(join(config.path._testFE, 'modules', folderOfModule)))
                .on('finish', function () {
                  gulp.src(join(config.path._modules, folderOfModule, config.path._testE2E, '**/*'))
                    .pipe(gulp.dest(join(config.path._testE2E, 'modules', folderOfModule)))
                    .on('finish', function () {
                      console.log('Скопировали тесты для модуля:', folderOfModule);
                      resolve(folderOfModule);
                    });
                });
            });
        });
    } catch (e) {
      console.error('Ошибка копирования тестов модуля', folderOfModule + ':', e);
      reject(e);
    }
  });
}

// ################################################################################
// ##                Таски по работе с метой ION                                 ##
// ################################################################################
gulp.task('build:metadata', function (done) {
  var qntMetaToBuild;
  var qntMetaBuilded = 0;

  function metaConfigBuild(callback) {
    var appConfig = {};
    getDirAndFilesList(join(xreq.app('.', true), config.folder._config, 'meta'),
      {recurse: 1, type: 'dir'},
      function (err, metaList) {
        if (!metaList || !metaList.dir || !metaList.dir.length) {// Если папок меты нет - выходим
          callback(err);
        } else {
          var qntMetaConfigToUpdate = metaList.dir.length;
          for (var i = 0; i < qntMetaConfigToUpdate; i++) {
            try {
              let metaConf = require(join(metaList.dir[i], 'config.json'));
              for (let key in metaConf) {
                if (metaConf.hasOwnProperty(key)) {
                  if (appConfig[key]) {
                    console.warn('Ранее заданное свойство конфигурации меты %s, перекрывается из конфига меты:', key,
                      baseName(metaList.dir[i]));
                  }
                  appConfig[key] = metaConf[key];
                }
              }
              console.log('Использован конфиг меты', baseName(metaList.dir[i]));
            } catch (e) {
              console.log('Отсутствует файл конфигруации приложения метой', baseName(metaList.dir[i]));
            }
          }
          if (appConfig && Object.keys(appConfig).length) {
            fs.writeFileSync(join(config.path._app, config.folder._config, 'meta.json'),
              JSON.stringify(appConfig, null, 2), 'utf8');
          }
          callback(null);
        }
      });
  }

  function endMetaBuild(folderOfMeta) {
    console.log('Закончена сборка меты %s. ', folderOfMeta, 'Подготавливаем конфиг меты для приложения');
    qntMetaBuilded++;
    if (qntMetaBuilded === qntMetaToBuild) {
      metaConfigBuild(function () {
        console.log('Закончена сборка меты');
        done();
      });
    }
  }
  getDirAndFilesList(config.path._meta, {recurse: 0,
      type: 'dir'},
    function (err, metaList) {
      if (!metaList || !metaList.dir || !metaList.dir.length) {// Если нет папок модулей - выходим
        done();
      } else {
        qntMetaToBuild = metaList.dir.length;
        for (var i = 0; i < qntMetaToBuild; i++) {
          // TODO как и зачем ставить npm, bower?
          // metaNPMInstall(baseName(metaList.dir[i]))
          // .then(metaBowerInstall)
          metaCopyInitDate(baseName(metaList.dir[i]))
            // .then(metaCopyInitDate)
            .then(metaCopyConfig)
            .then(metaVendorRelocate)
            .then(metaCopyFrontends)
            .then(metaCopyTemplates)
            .then(metaCopyTests)
            .then(metaCopyModulesCode)
            .then(endMetaBuild)
            .catch(done);
        }
      }
    });
});

/**
 * Установка пакетов меты
 *
 * @param {String} folderOfMeta - название (папка) меты
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
/* TODO как ставить и что ставить? и зачем?
function metaNPMInstall(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      exec('npm install --production',
        {cwd: join(config.path._modules, folderOfMeta)}, function (err, stdout, stderr) {
          console.log('Установили пакеты модуля:', folderOfMeta);
          if (stdout) {
            console.log(stdout);
          }
          if (stderr) {
            console.log(stderr);
          }
          if (err !== null) {
            console.log('exec error: ' + err);
          }
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка установки пакетов модуля', folderOfMeta + ':', e);
      reject(e);
    }
  });
}*/

/**
 * Установка пакетов bower меты

 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
/* TODO как ставить и что ставить? и зачем?
function metaBowerInstall(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      exec('bower install --config.interactive=false --offline', //  --force --quiet --offline
        {cwd: join(config.path._modules, folderOfMeta)}, function (err, stdout, stderr) {
          console.log('Установили пакеты bower модуля:', folderOfMeta);
          if (stdout) {
            console.log(stdout);
          }
          if (stderr) {
            console.log(stderr);
          }
          if (err !== null) {
            console.log('exec error: ' + err);
          }
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка установки bower модуля', folderOfMeta + ':', e);
      reject(e);
    }
  });
}*/

/**
 * Копирование вендорских пакетов для меты - всех вложенных (для всех модулей и ядра)
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaVendorRelocate(folderOfMeta) {

  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._meta, folderOfMeta, config.path._src, config.folder._vendor, '**/*'))
        .pipe(gulp.dest(join(config.path._public, config.folder._vendor)))
        .on('finish', function () {
          console.log('Скопировали файлы венодрских пакетов для меты:', folderOfMeta);
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка копирования файлов вендорских пакетов меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы конфигурации приложения из config/ в /app/config/meta/[имя меты]
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyConfig(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      // Схема с подпапками не работет, при инициализации конфига - поэтому формируем сводный файл
      // gulp.src(join(config.path._meta, folderOfMeta, config.folder._config, '**/*'))
      //  .pipe(gulp.dest(join(config.path._app, config.folder._config,  'meta', folderOfMeta)));
      gulp.src(join(config.path._meta, folderOfMeta, config.folder._config, 'config.json'))
        .pipe(gulp.dest(join(config.path._app, config.folder._config,  'meta', folderOfMeta)))
        .on('finish', function () {
          console.log('Скопировали конфигурационные файлы приложения меты:', folderOfMeta);
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка копирования конфигурационных файлов приложения меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем инициализирующие данные из init-data/[тип бд] в /app/init/init-data/[тип бд]/meta/[имя меты]
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyInitDate(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      var confApp = xreq.app('config');
      gulp.src(join(config.path._meta, folderOfMeta, config.folder._initdata, confApp.db, '**/*'))
        .pipe(gulp.dest(join(config.path._init, config.folder._initdata, confApp.db, 'meta', folderOfMeta)))
        .on('finish', function () {
          console.log('Скопировали файлы инициалиации БД для меты:', folderOfMeta);
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка копирования файлов инициализации БД меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы фронтенда меты в публик /public/[тип файлов] - т.е. может перетереть любые из модулей
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyFrontends(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._meta, folderOfMeta, config.path._srcFE, config.folder._fonts, '**/*'))
        .pipe(gulp.dest(join(config.path._public, config.folder._fonts)))
        .on('finish', function () {
          gulp.src(join(config.path._meta, folderOfMeta, config.path._srcFE, config.folder._js, '**/*'))
            .pipe(gulp.dest(join(config.path._public, config.folder._js)))
            .on('finish', function () {
              gulp.src(join(config.path._meta, folderOfMeta, config.path._srcFE, config.folder._img, '**/*'))
                .pipe(gulp.dest(join(config.path._public, config.folder._img)))
                .on('finish', function () {
                  gulp.src(join(config.path._meta, folderOfMeta, config.path._srcFE, config.folder._html, '**/*'))
                    .pipe(gulp.dest(join(config.path._public)))
                    .on('finish', function () {
                      gulp.src(join(config.path._meta, folderOfMeta, config.path._srcFE, config.folder._css, '**/*'))
                        .pipe(gulp.dest(join(config.path._public, config.folder._css)))
                        .on('finish', function () { // TODO для остальных
                          console.log('Скопировали файлы фронтенд для меты:', folderOfMeta);
                          resolve(folderOfMeta);
                        });
                    });
                });
            });
        });
    } catch (e) {
      console.error('Ошибка копирования файлов фронтенда меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы шаблонов меты в private /private - т.е. может перетереть любые из меты
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyTemplates(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._meta, folderOfMeta, config.path._src, config.folder._templates, '**/*'))
        .pipe(gulp.dest(join(config.path._private, config.folder._templates)))
        .on('finish', function () {
          console.log('Скопировали шаблоны для меты:', folderOfMeta);
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка копирования шаблонов мемты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем файлы тестов меты из ./test/[тип теста] в папку портала /test/[тип теста]/meta/[имя меты]
 *
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyTests(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._meta, folderOfMeta, config.path._testBE, '**/*'))
        .pipe(gulp.dest(join(config.path._testBE, 'metas', folderOfMeta)))
        .on('finish', function () {
          gulp.src(join(config.path._meta, folderOfMeta, config.path._testME, '**/*'))
            .pipe(gulp.dest(join(config.path._testME, 'meta', folderOfMeta)))
            .on('finish', function () {
              gulp.src(join(config.path._meta, folderOfMeta, config.path._testFE, '**/*'))
                .pipe(gulp.dest(join(config.path._testFE, 'meta', folderOfMeta)))
                .on('finish', function () {
                  gulp.src(join(config.path._meta, folderOfMeta, config.path._testE2E, '**/*'))
                    .pipe(gulp.dest(join(config.path._testE2E, 'meta', folderOfMeta)))
                    .on('finish', function () {
                      console.log('Скопировали тесты для меты:', folderOfMeta);
                      resolve(folderOfMeta);
                    });
                });
            });
        });
    } catch (e) {
      console.error('Ошибка копирования тестов меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}

/**
 * Копируем исполняемый код для из меты в модули. Структруа кода, должна повторять стркутуру папки modules, т.е. включать название модуля и все пути в нём.
 * @param {String} folderOfMeta - название (папка) модуля
 * @returns {Promise} resolve - промизе при положеительном результате, содержит название (папка) модуля
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function metaCopyModulesCode(folderOfMeta) {
  return new Promise(function (resolve, reject) {
    try {
      gulp.src(join(config.path._meta, folderOfMeta, config.path._modules, '**/*'))
        .pipe(gulp.dest(join(config.path._modules)))
        .on('finish', function () {
          console.log('Скопировали код модулей меты :', folderOfMeta);
          resolve(folderOfMeta);
        });
    } catch (e) {
      console.error('Ошибка копирования кода модулей меты', folderOfMeta + ':', e);
      reject(e);
    }
  });
}
