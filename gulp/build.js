// jscs:disable requireCapitalizedComments
'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var cssMin = require('gulp-clean-css');
var jsMin = require('gulp-jsmin');
var rename = require('gulp-rename');
const spawn = require('child_process').spawn;

var fs = require('fs');
var path = require('path');
var runSequence = require('run-sequence');

var importer = require('lib/import');

var platformPath = path.normalize(path.join(__dirname, '..'));

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
    var child = spawn(command,
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
        reject('install failed with code ' + code);
        return;
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
  return new Promise(function (resolve, reject) {
    gulp.src([path.join(src, '**/*')]).pipe(gulp.dest(dest)).
    on('finish', function () {
      console.log(msg);
      resolve();
    }).
    on('error', reject);
  });
}

function copyVendorResources(src, dst, module) {
  var result = false;
  var dist = path.join(src, module, 'dist');
  var min = path.join(src, module, 'min');
  // var build = path.join(src, module, 'build');
  var dest = path.join(dst, module);

  result = copyResources(
    dist,
    dest,
    'Скопированы дистрибутивные файлы вендорского пакета ' + module);
  /*
  if (!result) {
    result = copyResources(
      build,
      dest,
      'Скопированы дистрибутивные файлы вендорского пакета ' + module);
  }
  */
  if (!result) {
    result = copyResources(
      min,
      dest,
      'Скопированы минифицированные файлы вендорского пакета ' + module);
  }

  if (!result) {
    result = copyResources(
      path.join(src, module),
      dest,
      'Скопированы файлы вендорского пакета ' + module);
  }

  return result;
}

function bower(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов фронтенда для пути ' + p);
      try {
        fs.accessSync(path.join(p, '.bowerrc'));
      } catch (error) {
        resolve();
        return;
      }
      try {
        var bc = JSON.parse(fs.readFileSync(path.join(p, '.bowerrc'), {encoding: 'utf-8'}));
        run(p, 'bower', ['install', '--config.interactive=false'], function () {
          try {
            fs.accessSync(bc.directory);
            var vendorModules = fs.readdirSync(bc.directory);
            var copyers, copyer;
            copyers = [];
            for (var i = 0; i < vendorModules.length; i++) {
              copyer = copyVendorResources(bc.directory, bc.vendorDir, vendorModules[i]);
              if (copyer) {
                copyers.push(copyer);
              }
            }
            if (copyers.length) {
              Promise.all(copyers).then(resolve).catch(reject);
              return;
            }
          } catch (error) {}
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
      console.log('Компиляция less-файлов для пути ' + p);
      try {
        gulp.src([path.join(p, 'view/less/*.less')])
          .pipe(less({
            paths: [path.join(p, 'view/less/*.less')]
          }))
          .pipe(rename({
            suffix: '.less'
          }))
          .pipe(gulp.dest(path.join(p, 'view/static/css')))
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
      console.log('Минификация файлов стилей фронтенда для пути ' + p);
      try {
        gulp.src([
          path.join(p, 'view/static/css/*.css'),
          '!' + path.join(p, 'view/static/css/*.min.css')
        ], {base: path.join(p, 'view/static/css')})
          .pipe(cssMin())
          .pipe(rename({suffix: '.min'}))
          .pipe(gulp.dest(path.join(p, 'view/static/css')))
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
      console.log('Минификация файлов скриптов фронтенда для пути ' + p);
      try {
        gulp.src(
          [
            path.join(p, 'view/static/js/*.js'),
            '!' + path.join(p, 'view/static/js/*.min.js')
          ], {base: path.join(p, 'view/static/js')})
          .pipe(jsMin())
          .pipe(rename({suffix: '.min'}))
          .pipe(gulp.dest(path.join(p, 'view/static/js')))
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

gulp.task('build:bower', function (done) {
  var modulesDir = path.join(platformPath, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = bower(platformPath)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(bower(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('compile:less', function (done) {
  var modulesDir = path.join(platformPath, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = compileLess(platformPath)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(compileLess(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('minify:css', function (done) {
  var modulesDir = path.join(platformPath, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = minifyCSS(platformPath)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(minifyCSS(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('minify:js', function (done) {
  var modulesDir = path.join(platformPath, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = minifyJS(platformPath)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(minifyJS(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

function setup(appDir, scope, navSetup) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка приложения по пути ' + appDir);
      var nav = null;
      try {
        fs.accessSync(path.join(appDir, 'navigation.json'));
        nav = JSON.parse(fs.readFileSync(path.join(appDir, 'navigation.json')));
      } catch (err) {
        console.warn('Не удалось прочитать конфигурацию навигации.');
      }

      var ns = nav ? nav.namespace || '' : '';

      console.log('Импорт выполняется в ' + (ns ? 'пространство имен ' + ns : 'глобальное пространство имен'));
      importer(appDir, scope.dbSync, scope.metaRepo, scope.dataRepo, {
        namespace: ns
      }).then(
        function () {
          console.log('Мета и данные импортированы в БД');
          if (nav) {
            for (var module in nav.modules) {
              if (nav.modules.hasOwnProperty(module)) {
                if (!navSetup.hasOwnProperty(module)) {
                  navSetup[module] = {namespaces: {}, menus: {}};
                }

                if (nav.namespace) {
                  navSetup[module].namespaces[nav.namespace] = nav.namespaceCaption || '';
                }

                for (var nm in nav.modules[module]) {
                  if (nav.modules[module].hasOwnProperty(nm)) {
                    if (!navSetup[module].hasOwnProperty(nm)) {
                      navSetup[module].menus[nm] = [];
                    }
                    Array.prototype.push.apply(navSetup[module].menus[nm], nav.modules[module][nm]);
                  }
                }
              }
            }
          }
          resolve();
        }
      ).catch(reject);
    });
  };
}

gulp.task('setup', function (done) {
  console.log('Установка приложений.');
  var config = require('../config');
  var di = require('core/di');

  var IonLogger = require('core/impl/log/IonLogger');

  var sysLog = new IonLogger({});

  var scope = null;

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
      var navSetup = {};

      try {
        var applications = fs.readdirSync(appDir);
        for (var i = 0; i < applications.length; i++) {
          stat = fs.statSync(path.join(appDir, applications[i]));
          if (stat.isDirectory()) {
            if (!stage) {
              stage = setup(path.join(appDir, applications[i]), scope, navSetup)();
            } else {
              stage = stage.then(setup(path.join(appDir, applications[i]), scope, navSetup));
            }
          }
        }
      } catch (err) {
        rj(err);
        return;
      }

      if (stage) {
        stage.then(function () {
          var dir, fn, old, nm;
          for (var module in navSetup) {
            if (navSetup.hasOwnProperty(module)) {
              dir = path.join(platformPath, 'modules', module);
              fn = path.join(dir, 'config', 'navigation.json');
              try {
                fs.accessSync(dir);
                console.log('Запись конфигурации навигации модуля ' + module);
                try {
                  fs.accessSync(fn);
                  old = JSON.parse(fs.readFileSync(fn));
                  for (nm in navSetup[module].namespaces) {
                    if (navSetup[module].namespaces.hasOwnProperty(nm)) {
                      if (!old.namespaces) {
                        old.namespaces = {};
                      }
                      old.namespaces[nm] = navSetup[module].namespaces[nm];
                    }
                  }

                  for (nm in navSetup[module].menus) {
                    if (navSetup[module].menus.hasOwnProperty(nm)) {
                      if (!old.menus) {
                        old.menus = {};
                      }
                      if (old.menus.hasOwnProperty(nm)) {
                        Array.prototype.push.apply(old.menus[nm], navSetup[module].menus[nm]);
                      } else {
                        old.menus[nm] = navSetup[module].menus[nm];
                      }
                    }
                  }
                  fs.writeFileSync(fn, JSON.stringify(old));
                } catch (err) {
                  fs.writeFileSync(fn, JSON.stringify(navSetup[module]));
                }
              } catch (err) {
                console.warn(err);
              }
            }
          }
          return scope.dataSources.disconnect();
        }).then(function () {
          console.log('Установка приложений завершена.');
          rs();
        }).catch(rj);
      } else {
        console.log('Нет приложений для установки.');
        scope.dataSources.disconnect().then(function () {
          rs();
        }).catch(rj);
      }
    });
  }).
  then(done).
  catch(function (err) {
    console.error(err);
    scope.dataSources.disconnect().then(function () {
      done(err);
    }).catch(function () {
      done(err);
    });
  });
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
