'use strict';

/*eslint "require-jsdoc": off */

const gulp = require('gulp');
const less = require('gulp-less');
const cssMin = require('gulp-clean-css');
const jsMin = require('gulp-jsmin');
const rename = require('gulp-rename');
const spawn = require('child_process').spawn;
const extend = require('extend');

const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');
const importer = require('lib/import');
const deployer = require('lib/deploy');
const alias = require('core/scope-alias');
const aclImport = require('lib/aclImport');
const fe = require('./frontend');

const platformPath = path.normalize(path.join(__dirname, '..'));
const commandExtension = /^win/.test(process.platform) ? '.cmd' : '';

/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
gulp.task('build', function (done) {
  runSequence(
    'build:npm', 'build:linux-dependencies', 'build:frontend', 'compile:less', 'minify:css', 'minify:js',
    (err) => {
      if (!err) {
        console.log('Сборка платормы, модулей и приложений завершена.');
      }
      done(err);
    }
  );
});

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

function npm(path) {
  return new Promise(function (resolve, reject) {
    run(path, 'npm', ['install', '--production', '--no-save'], resolve, reject);
  });
}

function copyResources(src, dest, msg) {
  return function (skip) {
    return new Promise(function (resolve, reject) {
      if (!skip) {
        try {
          fs.accessSync(src);
        } catch (err) {
          resolve(false);
          return;
        }
        gulp.src([path.join(src, '**', '*')])
          .pipe(gulp.dest(dest))
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

function copyVendorResources(src, dst, module) {
  return new Promise(function (resolve, reject) {
    let dist = path.join(src, module, 'dist');
    let min = path.join(src, module, 'min');
    // let build = path.join(src, module, 'build');
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

function frontend(p) {
  return async function () {
      try {
        /**
         * Параметры конфигурации bower
         * @property {String} vendorDir - папка установки пакетов
         */
        if (!fs.existsSync(path.join(p, '.bowerrc')))
          return;
        let bc = JSON.parse(fs.readFileSync(path.join(p, '.bowerrc'), {encoding: 'utf-8'}));
        console.log('Установка пакетов фронтенда для пути ' + p);
        await npm(p);
        let srcDir = path.join(p, './node_modules');
        fs.accessSync(srcDir);
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
          await Promise.all(copyers);
        }
      } catch (error) {
        throw error;
      }
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
        gulp.src([path.join(p, 'less', '*.less')])
          .pipe(less({
            paths: [path.join(p, 'less', '*.less')]
          }))
          .pipe(rename({
            suffix: '.less'
          }))
          .pipe(gulp.dest(path.join(p, 'static', 'css')))
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
        gulp.src([
          path.join(p, 'static', 'css', '*.css'),
          '!' + path.join(p, 'static', 'css', '*.min.css')
        ], {base: path.join(p, 'static', 'css')})
          .pipe(cssMin({rebase: false}))
          .pipe(rename({suffix: '.min'}))
          .pipe(gulp.dest(path.join(p, 'static', 'css')))
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
        gulp.src(
          [
            path.join(p, 'static', 'js', '*.js'),
            '!' + path.join(p, 'static', 'js', '*.min.js')
          ], {base: path.join(p, 'static', 'js')})
          .pipe(jsMin())
          .pipe(rename({suffix: '.min'}))
          .pipe(gulp.dest(path.join(p, 'static', 'js')))
          .on('finish', resolve)
          .on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function buildDir(start, dir) {
  let modulesDir = path.join(platformPath, dir);
  let modules = fs.readdirSync(modulesDir);
  let stat;
  let f = start;
  for (let i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      f = f.then(npm(path.join(modulesDir, modules[i])))
        .then(() => {
          console.log('Установлен пакет бэкенда для пути ' + path.join(modulesDir, modules[i]));
        });
    }
  }
  return f;
}

gulp.task('build:linux-dependencies', (done) => {
  let w = /^linux/.test(process.platform) ?
    new Promise((resolve, reject) => {
      run(path.join(platformPath), './linux/fixdep.sh', [], resolve, reject);
    }) :
    Promise.resolve();
  w.then(done).catch((err) => {
    console.error(err);
    done();
  });
});

gulp.task('build:npm', (done) => {
  console.log('Установка пакетов бэкенда для пути ' + platformPath);
  let w = buildDir(buildDir(npm(platformPath), 'modules'), 'applications');

  w.then(done).catch((err) => {
    console.error(err);
    done(err);
  });
});

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

gulp.task('build:frontend', function (done) {
  let themes = themeDirs();
  let start = null;
  for (let i = 0; i < themes.length; i++) {
    if (start) {
      start = start.then(frontend(themes[i]));
    } else {
      start = frontend(themes[i])();
    }
  }
  if (!start) {
    start = Promise.resolve();
  }
  start.then(function () {
    done();
  })
  .catch(function (err) {
    console.error('build:frontend error:', JSON.stringify(err, null, '\t'));
    done(err);
  });
});

gulp.task('bower:parse', function (done) {
  try {
    fe.makeMigrationDict();
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('bower:package', function (done) {
  try {
    fe.processBower();
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('bower:away', function (done) {
  try {
    fe.bower();
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('clear:build', function (done) {
  try {
    fe.clear();
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('clear:frontend', function (done) {
  try {
    fe.clear(item => item.indexOf('view') !== -1);
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('clear:npm', function (done) {
  try {
    fe.clear(item => item.indexOf('view') === -1);
    done();
  } catch (err) {
    done(err);
  }
});

gulp.task('compile:less', function (done) {
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
});

gulp.task('minify:css', function (done) {
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
  start.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('minify:js', function (done) {
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
  start.then(function () {
    done();
  })
    .catch(function (err) {
      console.error(err);
      done(err);
    });
});

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

gulp.task('deploy', function (done) {
  console.log('Развертывание и импорт данных приложений.');
  /**
   * Параметры конфигруации сборки
   * @property {object} log - параметры логгирования
   * @property {object} bootstrap - параметры загрузки
   * @property {object} di - параметры интерфейсов данных
   */
  let config = require('../config');
  let di = require('core/di');

  let IonLogger = require('core/impl/log/IonLogger');

  let sysLog = new IonLogger(config.log || {});

  let scope = null;

  let appDir = path.join(platformPath, 'applications');
  let applications = fs.readdirSync(appDir);
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
});

gulp.task('assemble', (done) => {
  console.log('Сборка и развертывание платформы и приложений ION.');
  runSequence('build', 'deploy', function (err) {
    if (!err) {
      console.log('Выполнена сборка и развертывание платформы и приложений ION.');
    }
    done(err);
  });
});
