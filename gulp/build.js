// jscs:disable requireCapitalizedComments
'use strict';

const gulp = require('gulp');
const less = require('gulp-less');
const cssMin = require('gulp-clean-css');
const jsMin = require('gulp-jsmin');
const rename = require('gulp-rename');
const spawn = require('child_process').spawn;

const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');
const importer = require('lib/import');
const deployer = require('lib/deploy');

const platformPath = path.normalize(path.join(__dirname, '..'));
const commandExtension = /^win/.test(process.platform) ? '.cmd' : '';

// jshint maxcomplexity: 30, maxstatements: 40
/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
gulp.task('build', function (done) {
  runSequence('build:npm', 'build:bower', 'compile:less', 'minify:css', 'minify:js', function (err) {
    if (!err) {
      console.log('Сборка приложения завершена.');
    }
    done(err);
  });
});

function run(path, command, args, resolve, reject) {
  try {
    var child = spawn(command + commandExtension,
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
        return reject('install failed with code ' + code);
      }
      resolve();
    });
  } catch (error) {
    reject(error);
  }
}

function npm(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов бэкенда для пути ' + path);
      run(path, 'npm', ['install', '--production'], resolve, reject);
    });
  };
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
        gulp.src([path.join(src, '**', '*')]).
        pipe(gulp.dest(dest)).
        on('finish', function () {
          console.log(msg);
          resolve(true);
        }).
        on('error', reject);
      } else {
        resolve(true);
      }
    });
  };
}

function copyVendorResources(src, dst, module) {
  return new Promise(function (resolve, reject) {
    var dist = path.join(src, module, 'dist');
    var min = path.join(src, module, 'min');
    // var build = path.join(src, module, 'build');
    var dest = path.join(dst, module);

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
        var bc = JSON.parse(fs.readFileSync(path.join(p, '.bowerrc'), {encoding: 'utf-8'}));
        console.log('Установка пакетов фронтенда для пути ' + p);
        run(p, 'bower', ['install', '--config.interactive=false'], function () {
          var srcDir = path.join(p, bc.directory);
          try {
            fs.accessSync(srcDir);
          } catch (err) {
            resolve();
            return;
          }
          try {
            var vendorModules = fs.readdirSync(srcDir);
            var copyers, copyer;
            copyers = [];
            if (bc.vendorDir) {
              for (var i = 0; i < vendorModules.length; i++) {
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
  var modulesDir = path.join(platformPath, dir);
  var modules = fs.readdirSync(modulesDir);
  var stat;
  var f = start;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      f = f.then(npm(path.join(modulesDir, modules[i])));
    }
  }
  return f;
}

gulp.task('build:npm', function (done) {
  var w = buildDir(buildDir(npm(platformPath)(), 'modules'), 'applications');

  w.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

function _themeDirs(basePath) {
  var themes = [];
  if (fs.existsSync(basePath)) {
    var tmp = fs.readdirSync(basePath);
    tmp.forEach(function (dir) {
      var theme = path.join(basePath, dir);
      var stat = fs.statSync(theme);
      if (stat.isDirectory()) {
        themes.push(theme);
      }
    });
  }
  return themes;
}

function themeDirs() {
  var themes = _themeDirs(path.join(platformPath, 'view'));
  var pth = path.join(platformPath, 'modules');
  var tmp = fs.readdirSync(pth);
  tmp.forEach(function (dir) {
    var module = path.join(pth, dir);
    var stat = fs.statSync(module);
    if (stat.isDirectory()) {
      themes.push(path.join(module, 'view'));
      Array.prototype.push.apply(themes, _themeDirs(path.join(module, 'view')));
    }
  });
  pth = path.join(platformPath, 'applications');
  tmp = fs.readdirSync(pth);
  tmp.forEach(function (dir) {
    var module = path.join(pth, dir);
    var stat = fs.statSync(module);
    if (stat.isDirectory()) {
      var themesDir = path.join(module, 'themes');
      if (fs.existsSync(themesDir)) {
        Array.prototype.push.apply(themes, _themeDirs(themesDir));
      } else {
        themes.push(module);
      }
    }
  });
  return themes;
}

gulp.task('build:bower', function (done) {
  var themes = themeDirs();
  var start = null;
  for (var i = 0; i < themes.length; i++) {
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
  }).
  catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('compile:less', function (done) {
  var themes = themeDirs();
  var start = null;
  for (var i = 0; i < themes.length; i++) {
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
  }).
  catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('minify:css', function (done) {
  var themes = themeDirs();
  var start = null;
  for (var i = 0; i < themes.length; i++) {
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
  var themes = themeDirs();
  var start = null;
  for (var i = 0; i < themes.length; i++) {
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
  }).
  catch(function (err) {
    console.error(err);
    done(err);
  });
});

function setup(appDir, scope, log) {
  return function () {
    return new Promise(function (resolve, reject) {
      deployer(appDir).then(function (dep) {
        console.log('Выполнена настройка приложения.');
        var ns = dep ? dep.namespace || '' : '';
        console.log('Импорт выполняется в ' +
          (ns ? 'пространство имен ' + ns : 'глобальное пространство имен'));
        return importer(appDir, scope.dbSync, scope.metaRepo, scope.dataRepo, log, {
          namespace: ns,
          ignoreIntegrityCheck: true // Игнорирование контроля целостности, иначе удаляются ссылочные атрибуты, т.к. объекты на которые ссылка, ещё не импортированы
        });
      }).then(function () {
        console.log('Мета и данные импортированы в БД');
        resolve();
      }).catch(reject);
    });
  };
}

gulp.task('setup', function (done) {
  console.log('Установка приложений.');
  var config = require('../config');
  var di = require('core/di');

  var IonLogger = require('core/impl/log/IonLogger');

  var sysLog = new IonLogger(config.log || {});

  var scope = null;

  function finish(err) {
    if (!scope) {
      return done(err);
    }
    scope.dataSources.disconnect().then(function () {
      done(err);
    }).catch(function (dcer) {
      console.error(dcer);
      done(err);
    });
  }

  di('app', config.di,
    {
      sysLog: sysLog
    },
    null,
    ['auth', 'rtEvents', 'sessionHandler']
  ).then(function (scp) {
    scope = scp;
    return new Promise(function (rs, rj) {
      var appDir =  path.join(platformPath, 'applications');
      var stage, stat;

      try {
        var applications = fs.readdirSync(appDir);
        for (var i = 0; i < applications.length; i++) {
          stat = fs.statSync(path.join(appDir, applications[i]));
          if (stat.isDirectory()) {
            if (!stage) {
              stage = setup(path.join(appDir, applications[i]), scope, sysLog)();
            } else {
              stage = stage.then(setup(path.join(appDir, applications[i]), scope, sysLog));
            }
          }
        }
      } catch (err) {
        return rj(err);
      }

      if (stage) {
        stage.then(function () {
          console.log('Установка приложений завершена.');
          rs();
        }).catch(rj);
      } else {
        console.log('Нет приложений для установки.');
        rs();
      }
    });
  }).
  then(finish).
  catch(finish);
});

gulp.task('install', function (done) {
  console.log('Установка платформы ION.');
  runSequence('build', 'setup', function (err) {
    if (!err) {
      console.log('Платформа ION установлена.');
    }
    done(err);
  });
});
