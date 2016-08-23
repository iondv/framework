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
const appDeployer = require('lib/appSetup');

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

function setup(appDir, scope) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка приложения по пути ' + appDir);
      var dep = null;
      try {
        fs.accessSync(path.join(appDir, 'deploy.json'));
        dep = JSON.parse(fs.readFileSync(path.join(appDir, 'deploy.json')));
      } catch (err) {
        console.warn('Не удалось прочитать конфигурацию развертывания.');
      }

      var ns = dep ? dep.namespace || '' : '';

      console.log('Импорт выполняется в ' + (ns ? 'пространство имен ' + ns : 'глобальное пространство имен'));
      importer(appDir, scope.dbSync, scope.metaRepo, scope.dataRepo, {
        namespace: ns
      }).then(
       function () {
        var worker;
        console.log('Мета и данные импортированы в БД');
        if (dep) {
          if (dep.deployer) {
            if (dep.deployer === 'built-in') {
              if (typeof dep.modules === 'object') {
                worker = function () {
                  return appDeployer(dep.modules);
                };
              }
            } else {
              worker = require(dep.deployer);
            }
            if (typeof worker === 'function') {
              console.log('Выполняется скрипт развертывания приложения');
              worker().then(resolve).catch(reject);
              return;
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

  function finish(err) {
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
              stage = setup(path.join(appDir, applications[i]), scope)();
            } else {
              stage = stage.then(setup(path.join(appDir, applications[i]), scope));
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
