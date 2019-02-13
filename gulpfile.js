/*eslint "require-jsdoc": off,  "no-console": off, "no-sync": off*/

const {series, parallel} = require('gulp');
const gulpSrc = require('gulp').src;
const gulpDest = require('gulp').dest;
const assert = require('assert');
const nodePath = process.env.NODE_PATH.toLowerCase();


const less = require('gulp-less');
const cssMin = require('gulp-clean-css');
const jsMin = require('gulp-jsmin');
const rename = require('gulp-rename');
const spawn = require('child_process').spawn;
const extend = require('extend');

const fs = require('fs');
const path = require('path');
const importer = require('lib/import');
const deployer = require('lib/deploy');
const alias = require('core/scope-alias');
const aclImport = require('lib/aclImport');

const config = require('./config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');

const platformPath = path.normalize(__dirname);
const commandExtension = /^win/.test(process.platform) ? '.cmd' : '';

assert.ok(process.env.NODE_PATH,
  '\x1b[93;41mДолжна быть задана NODE_PATH c путем к дирректории запуска приложения:\x1b[0m ' + __dirname.toLowerCase());

assert.notEqual(nodePath.indexOf(__dirname.toLowerCase()), -1,
  '\x1b[93;41mNODE_PATH должна содержать путь к дирректории запуска приложения.\x1b[0m\nСейчас:           ' +
             nodePath + '\nДолжна содержать: ' + __dirname.toLowerCase());

/*****************
* TODO check metada - gulp 3.9.1
********************/

// const jsonSchema = require('gulp-json-schema');
// const runSequence = require('run-sequence');
// const path = require('path');
// const join = path.join;
//
// const pathSchema = './test/meta-schema';
// const pathApplications = './applications/';
//
// const schemaOptions = {
//   emitError: false,
//   verbose: true,
//   banUnknownProperties: true,
//   checkRecursive: true,
//   schemas: [join(pathSchema, 'command.schema.json'), join(pathSchema, 'view-properties.schema.json')],
//   missing: 'error'};
//  // параметры валидации: https://www.npmjs.com/package/gulp-json-schema#options,
//  // относительно schemas, возможно имеет смысл вложеные схемы перетащить в отдельную папку и дергать ее целиком,
//  // пока не стала раскапывать варианты "как это сделать" *

// gulp.task('validate:meta', function (done) { // Без runSequence вывод сваливается в кучу, последовательно удобнее
//   runSequence(
//     ['validate:meta:class'],
//     ['validate:meta:view-create&item'],
//     ['validate:meta:view-list'],
//     ['validate:meta:navigation-section'],
//     ['validate:meta:navigation-unit'],
//     function () {
//       done();
//     });
// });
//
// gulp.task('validate:meta:class', function () {
//   console.log('Проверяем мету классов.');
//   return gulp.src([join(pathApplications, '*/meta/*.json')])
//     .pipe(jsonSchema(join(pathSchema, 'class.main.schema.json'), schemaOptions));
// });
//
// gulp.task('validate:meta:view-create&item', function () {
//   console.log('Проверяем мету представлений создания и изменения.');
//   return gulp.src([join(pathApplications, '*/views/*/create.json'),
//     join(pathApplications, '*/views/*/item.json')])
//     .pipe(jsonSchema(join(pathSchema, 'view-createnitem.main.schema.json'), schemaOptions));
// });
//
// gulp.task('validate:meta:view-list', function () {
//   console.log('Проверяем мету представлений списка.');
//   return gulp.src([join(pathApplications, '*/views/*/list.json')])
//     .pipe(jsonSchema(join(pathSchema, 'view-list.main.schema.json'), schemaOptions));
// });
//
// gulp.task('validate:meta:navigation-section', function () {
//   console.log('Проверяем мету секций навигации.');
//   return gulp.src([join(pathApplications, '*/navigation/*.section.json')])
//     .pipe(jsonSchema(join(pathSchema, 'navigation-section.main.schema.json'), schemaOptions));
// });
//
// gulp.task('validate:meta:navigation-unit', function () {
//   console.log('Проверяем мету узлов навигации.');
//   return gulp.src([join(pathApplications, '*/navigation/*/*.json')])
//     .pipe(jsonSchema(join(pathSchema, 'navigation-unit.main.schema.json'), schemaOptions));
// });


/*******************************
* Build and deploy tasks
********************************/

/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
const build = series(parallel(buildNpm, buildLinuxDependencies, buildBower, compileLessAll),
  parallel(minifyCssAll, minifyJsAll));


function deploy(done) {
  console.log('Развертывание и импорт данных приложений.');
  /**
   * Параметры конфигруации сборки
   * @property {object} log - параметры логгирования
   * @property {object} bootstrap - параметры загрузки
   * @property {object} di - параметры интерфейсов данных
   */

  let sysLog = new IonLogger(config.log || {});

  let scope = null;

  const appDir = path.join(platformPath, 'applications');
  const applications = fs.readdirSync(appDir);
  let apps = [];
  let deps = [];

  di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents'])
    .then(scope =>
      di(
        'app',
        extend(true, config.di, scope.settings.get('plugins') || {}),
        {},
        'boot',
        ['auth', 'background', 'sessionHandler', 'scheduler', 'application']
      )
    )
    .then(scope => alias(scope, scope.settings.get('di-alias')))
    /**
     * @param {Object} scp
     * @param {Object} scp.dataSources
     * @param {SettingsRepository} scp.settings
     */
    .then((scp) => {
      scope = scp;
      let stage1 = Promise.resolve();
      try {
        if (!applications.length) {
          console.log('Нет приложений для установки.');
          return scp.dataSources.disconnect();
        }
        let first = true;
        applications.forEach((app) => {
          let pth = path.join(appDir, app);
          let stat = fs.statSync(pth);
          if (stat.isDirectory()) {
            stage1 = stage1.then(() =>
              deployer(
                pth,
                first ?
                  {resetSettings: true, preserveModifiedSettings: true, settings: scp.settings} :
                  {settings: scp.settings}
              )
                .then((dep) => {
                  first = false;
                  console.log('Выполнена настройка приложения ' + app);
                  apps.push(app);
                  deps.push(dep);
                })
            );
          }
        });

        return stage1.then(() => {
          console.log('Развертывание приложений завершено.');
          return scp.dataSources.disconnect();
        });
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .then(() =>
      di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents'])
        .then(scope =>
          di(
            'app',
            di.extract(
              ['dbSync', 'metaRepo', 'dataRepo', 'workflows', 'sequenceProvider', 'roleAccessManager', 'auth'],
              extend(true, config.di, scope.settings.get('plugins') || {})
            ),
            {},
            'boot',
            ['application']
          )
        )
        .then(scope => alias(scope, scope.settings.get('di-alias')))
    )
    .then((scp) => {
      scope = scp;
      let stage2 = Promise.resolve();
      for (let i = 0; i < apps.length; i++) {
        let stat = fs.statSync(path.join(appDir, apps[i]));
        if (stat.isDirectory()) {
          stage2 = stage2.then(appImporter(path.join(appDir, apps[i]), scope, sysLog, deps[i]));
        }
      }
      return stage2.then(() => {
        console.log('Импорт меты приложений завершен.');
      });
    })
    .then(() => scope.dataSources.disconnect().catch(err => console.error(err)))
    .then(() => done())
    .catch(err => done(err));
}

// App build and deply
const assemble = series(build, deploy);

function compileLessAll (done) {
  let themes = themeDirs();
  let start = null;
  for (let i = 0; i < themes.length; i++) {
    if (start) {
      start = start.then(compileLess(themes[i]));
    } else {
      start = compileLess(themes[i])();
    }
  }
  if (!start) {
    start = Promise.resolve();
  }

  start.then(function () {
    done();
  })
    .catch(function (err) {
      console.error(err);
      done(err);
    });
}

function minifyCssAll(done) {
  let themes = themeDirs();
  let start = null;
  for (let i = 0; i < themes.length; i++) {
    if (start) {
      start = start.then(minifyCSS(themes[i]));
    } else {
      start = minifyCSS(themes[i])();
    }
  }
  if (!start) {
    start = Promise.resolve();
  }
  start
    .then(done)
    .catch(function (err) {
      console.error(err);
      done(err);
    });
}

function minifyJsAll(done) {
  let themes = themeDirs();
  let start = null;
  for (let i = 0; i < themes.length; i++) {
    if (start) {
      start = start.then(minifyJS(themes[i]));
    } else {
      start = minifyJS(themes[i])();
    }
  }
  if (!start) {
    start = Promise.resolve();
  }
  start
    .then(done)
    .catch(function (err) {
      console.error(err);
      done(err);
    });
}

function buildNpm(done) {
  let w = buildDir(buildDir(npm(platformPath)(), 'modules'), 'applications');

  w.then(done).catch((err) => {
    console.error(err);
    done(err);
  });
}

function buildLinuxDependencies(done) {
  let w = /^linux/.test(process.platform) ?
    new Promise((resolve, reject) => {
      run(path.join(platformPath), './linux/fixdep.sh', [], resolve, reject);
    }) :
    Promise.resolve();
  w.then(() => {
    done();
  }).catch((err) => {
    console.error(err);
    done();
  });
}

function buildBower(done) {
  let themes = themeDirs();
  let start = null;
  for (let i = 0; i < themes.length; i++) {
    if (start) {
      start = start.then(bower(themes[i]));
    } else {
      start = bower(themes[i])();
    }
  }
  if (!start) {
    start = Promise.resolve();
  }
  start.then(function () {
    done();
  })
    .catch(function (err) {
      console.error(err);
      done(err);
    });
}


/*******************************
 * Service function
 ********************************/

function npm(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов бэкенда для пути ' + path);
      run(path, 'npm', ['install', '--production', '--no-save'], resolve, reject);
    });
  };
}

function bower(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      try {
        fs.accessSync(path.join(p, '.bowerrc'));
      } catch (error) {
        resolve();
        return;
      }
      try {
        /**
         * Параметры конфигурации bower
         * @property {String} vendorDir - папка установки пакетов
         */
        let bc = JSON.parse(fs.readFileSync(path.join(p, '.bowerrc'), {encoding: 'utf-8'}));
        console.log('Установка пакетов фронтенда для пути ' + p);
        run(p, 'bower', ['install', '--config.interactive=false'], function () {
          let srcDir = path.join(p, bc.directory);
          try {
            fs.accessSync(srcDir);
          } catch (err) {
            resolve();
            return;
          }
          try {
            let vendorModules = fs.readdirSync(srcDir);
            let copyers, copyer;
            copyers = [];
            if (bc.vendorDir) {
              for (let i = 0; i < vendorModules.length; i++) {
                copyer = copyVendorResources(srcDir, path.join(p, bc.vendorDir), vendorModules[i]);
                if (copyer) {
                  copyers.push(copyer);
                }
              }
            } else {
              console.warn('В .bowerrc не указана директория назначения для вендорских файлов [vendorDir]!');
            }
            if (copyers.length) {
              Promise.all(copyers).then(resolve).catch(reject);
              return;
            }
          } catch (error) {
            return reject(error);
          }
          resolve();
        }, reject);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function copyVendorResources(src, dst, module) {
  return new Promise(function (resolve, reject) {
    let dist = path.join(src, module, 'dist');
    let min = path.join(src, module, 'min');
    let dest = path.join(dst, module);

    copyResources(
      dist,
      dest,
      'Скопированы дистрибутивные файлы вендорского пакета ' + module
    )(false).then(copyResources(
      min,
      dest,
      'Скопированы минифицированные файлы вендорского пакета ' + module
      )
    ).then(copyResources(
      path.join(src, module),
      dest,
      'Скопированы файлы вендорского пакета ' + module
      )
    ).then(resolve).catch(reject);
  });
}

function copyResources(srcPath, destPath, msg) {
  return function (skip) {
    return new Promise(function (resolve, reject) {
      if (!skip) {
        try {
          fs.accessSync(srcPath);
        } catch (err) {
          resolve(false);
          return;
        }
        gulpSrc([path.join(srcPath, '**', '*')])
          .pipe(gulpDest(destPath))
          .on('finish', function () {
            console.log(msg);
            resolve(true);
          })
          .on('error', reject);
      } else {
        resolve(true);
      }
    });
  };
}

function compileLess(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      if (!fs.existsSync(path.join(p, 'less'))) {
        return resolve();
      }
      console.log('Компиляция less-файлов для пути ' + p);
      try {
        gulpSrc([path.join(p, 'less', '*.less')])
          .pipe(less({
            paths: [path.join(p, 'less', '*.less')]
          }))
          .pipe(rename({
            suffix: '.less'
          }))
          .pipe(gulpDest(path.join(p, 'static', 'css')))
          .on('finish', resolve)
          .on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function minifyCSS(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      if (!fs.existsSync(path.join(p, 'static', 'css'))) {
        return resolve();
      }
      console.log('Минификация файлов стилей фронтенда для пути ' + p);
      try {
        gulpSrc([
          path.join(p, 'static', 'css', '*.css'),
          '!' + path.join(p, 'static', 'css', '*.min.css')
        ], {base: path.join(p, 'static', 'css')})
          .pipe(cssMin({rebase: false}))
          .pipe(rename({suffix: '.min'}))
          .pipe(gulpDest(path.join(p, 'static', 'css')))
          .on('finish', resolve)
          .on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function minifyJS(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      if (!fs.existsSync(path.join(p, 'static', 'js'))) {
        return resolve();
      }

      console.log('Минификация файлов скриптов фронтенда для пути ' + p);
      try {
        gulpSrc(
          [
            path.join(p, 'static', 'js', '*.js'),
            '!' + path.join(p, 'static', 'js', '*.min.js')
          ], {base: path.join(p, 'static', 'js')})
          .pipe(jsMin())
          .pipe(rename({suffix: '.min'}))
          .pipe(gulpDest(path.join(p, 'static', 'js')))
          .on('finish', resolve)
          .on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function run(path, command, args, resolve, reject) {
  try {
    let child = spawn(command + commandExtension,
      args,
      {
        cwd: path,
        env: process.env
      }
    );

    child.stdout.on('data', function (data) {
      console.log(data.toString('utf-8'));
    });

    child.stderr.on('data', function (data) {
      console.error(data.toString('utf-8'));
    });

    child.on('close', function (code) {
      if (code !== 0) {
        return reject('child process failed with code ' + code);
      }
      return resolve();
    });
  } catch (error) {
    reject(error);
  }
}

function buildDir(start, dir) {
  let modulesDir = path.join(platformPath, dir);
  let modules = fs.readdirSync(modulesDir);
  let stat;
  let f = start;
  for (let i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      f = f.then(npm(path.join(modulesDir, modules[i])));
    }
  }
  return f;
}

function themeDirs() {
  let themes = _themeDirs(path.join(platformPath, 'view'));
  let pth = path.join(platformPath, 'modules');
  let tmp = fs.readdirSync(pth);
  tmp.forEach(function (dir) {
    let module = path.join(pth, dir);
    let stat = fs.statSync(module);
    if (stat.isDirectory()) {
      themes.push(path.join(module, 'view'));
      Array.prototype.push.apply(themes, _themeDirs(path.join(module, 'view')));
    }
  });
  pth = path.join(platformPath, 'applications');
  tmp = fs.readdirSync(pth);
  tmp.forEach(function (dir) {
    let module = path.join(pth, dir);
    let stat = fs.statSync(module);
    if (stat.isDirectory()) {
      let themesDir = path.join(module, 'themes');
      if (fs.existsSync(themesDir)) {
        Array.prototype.push.apply(themes, _themeDirs(themesDir));
      } else {
        themes.push(module);
      }
    }
  });
  return themes;
}

function _themeDirs(basePath) {
  let themes = [];
  if (fs.existsSync(basePath)) {
    let tmp = fs.readdirSync(basePath);
    tmp.forEach(function (dir) {
      let theme = path.join(basePath, dir);
      let stat = fs.statSync(theme);
      if (stat.isDirectory()) {
        themes.push(theme);
      }
    });
  }
  return themes;
}

/**
 * Импорт данных приложения
 * @param {string} appDir каталог приложения
 * @param scope
 * @param scope.roleAccessManager
 * @param scope.auth
 * @param scope.dataRepo
 * @param scope.dbSync
 * @param {Function} log - логгер
 * @param dep
 * @returns {Function}
 */
function appImporter(appDir, scope, log, dep) {
  return function () {
    let ns = dep ? dep.namespace || '' : '';
    console.log('Импорт меты приложения ' + appDir + ' выполняется в ' +
      (ns ? 'пространство имен ' + ns : 'глобальное пространство имен'));
    return aclImport(path.join(appDir, 'acl'), scope.roleAccessManager, log, scope.auth)
      .catch(err => log.error(err))
      .then(() => importer(appDir, {
        sync: scope.dbSync,
        metaRepo: scope.metaRepo,
        dataRepo: scope.dataRepo,
        workflows: scope.workflows,
        sequences: scope.sequenceProvider,
        log: log,
        namespace: ns,
        // Игнорирование контроля целостности, иначе удаляются ссылочные атрибуты, т.к. объекты на которые ссылка,
        // ещё не импортированы
        ignoreIntegrityCheck: true
      })).then(() => {console.log('Мета и данные приложения ' + appDir + ' импортированы в БД');});
  };
}

exports.build = build;
exports.deploy = deploy;
exports.assemble = assemble;
exports.default = assemble;
