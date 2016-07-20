// jscs:disable requireCapitalizedComments
'use strict';

var gulp = require('gulp');
var install = require('gulp-install');
var less = null;

var fs = require('fs');
var path = require('path');
var runSequence = require('run-sequence');

/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
gulp.task('build', ['build:npm', 'build:bower'/*, 'minify:css', 'minify:js'*/], function (done) {
  runSequence('build:npm', 'build:bower', function () {
    console.log('Сборка приложения завершена.');
    done();
  });
});

function npm(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов бэкенда для пути ' + path);
      try {
        process.chdir(path);
        gulp.src(['./package.json'])
          .pipe(install({production: true})).on('finish', resolve);
      } catch (error) {
        reject(error);
      }
    });
  };
}

function copyResources(src, dest, msg) {
  if (fs.existsSync(src)) {
    return new Promise(function (resolve, reject) {
      gulp.src([path.join(src, '**/*')]).pipe(gulp.dest(dest)).
      on('finish', function () {
        console.log(msg);
        resolve();
      }).
      on('error', reject);
    });
  }
  return false;
}

function copyVendorResources(src, dst, module) {
  var result = false;
  var dist = path.join(src, module, 'dist');
  var min = path.join(src, module, 'min');
  var build = path.join(src, module, 'build');
  var dest = path.join(dst, module);

  result = copyResources(
    dist,
    dest,
    'Скопированы дистрибутивные файлы вендорского пакета ' + module);

  if (!result) {
    result = copyResources(
      build,
      dest,
      'Скопированы дистрибутивные файлы вендорского пакета ' + module);
  }

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
        process.chdir(p);
        if (fs.existsSync('.bowerrc')) {
          var bc = JSON.parse(fs.readFileSync('.bowerrc', {encoding: 'utf-8'}));
          gulp.src(['./' + bc.json])
          .pipe(install({args: ['--config.interactive=false']})).on('finish', function () {
            if (fs.existsSync(bc.directory)) {
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
            }
            resolve();
          }); // '--offline' - офлайн ускоряет, но ваклит тестировани и сборку
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };
}

function compileless(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Компиляция less-файлов для пути ' + p);
      try {
        process.chdir(p);
        gulp.src([path.join(p, 'view/less/*.less')])
          .pipe(less({
            paths: [path.join(p, 'view/less/*.less')]
          }))
          .pipe(gulp.dest(path.join(p, 'view/static/css')));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}

gulp.task('build:npm', function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = npm(process.env.NODE_PATH)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(npm(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('build:bower', ['build:npm'], function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = bower(process.env.NODE_PATH)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(bower(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done();
  });
});

gulp.task('compile:less', ['build:bower'], function (done) {
  less = require('gulp-less');
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = compileless(process.env.NODE_PATH)();
  var stat;
  for (var i = 0; i < modules.length; i++) {
    stat = fs.statSync(path.join(modulesDir, modules[i]));
    if (stat.isDirectory()) {
      start = start.then(compileless(path.join(modulesDir, modules[i])));
    }
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done();
  });
});

/*
function minCss(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Минификация css-файлов фронтенда для пути ' + path);
      try {
        process.chdir(path);
        gulp.src([*/
       //   join(path, 'view/static/css/**/*.css'),
       //     join(path, 'view/static/vendor/css/**/*.css'),
       //   '!' + join(path, 'view/static/css/**/*.min.css')
/*        ])
          .pipe(sourcemaps.init())
          .pipe(autoprefixer(aprefConf))
          .pipe(minifyCSS())
          .pipe(rename({suffix: '.min'}))
          .pipe(sourcemaps.write('./maps'))
          .pipe(gulp.dest(join(config.path.public, config.folder.css)))
          .pipe(size({title: 'Total compressed CSS files (with source maps) size:'}));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}
*/
/*
gulp.task('minify:css', function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = minCss(process.env.NODE_PATH)();
  for (var i = 0; i < modules.length; i++) {
    start = start.then(minCss(path.join(modulesDir, modules[i])));
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done();
  });
});
*/
/*
function minJs(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Минификация js-файлов фронтенда для пути ' + path);
      var error;
      try {
        process.chdir(path);
        gulp.src(join(config.path.public, config.folder.js, config.file.mainJS))
          .pipe(sourcemaps.init())
          .pipe(stripDebug())
          .pipe(uglify())
          .pipe(rename({suffix: '.min'}))
          // For using ES6 .pipe(plugins.babel())
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(join(config.path.public, config.folder.js)))
          .pipe(size({title: 'Total compressed JavaScript files (with source maps) size:'}));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}
*/
/*
gulp.task('minify:js', function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = minJs(process.env.NODE_PATH)();
  for (var i = 0; i < modules.length; i++) {
    start = start.then(minJs(path.join(modulesDir, modules[i])));
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done();
  });
});
*/
