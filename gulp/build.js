// jscs:disable requireCapitalizedComments
'use strict';

var config = require('gulptask.conf.js');

var gulp = require('gulp');
var install = require('gulp-install');

// var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');

var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var map = require('map-stream');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var stripDebug = require('gulp-strip-debug');

var minifyCSS = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var size = require('gulp-size');
var autoprefixer = require('gulp-autoprefixer');

/**
 * Инициализируем первичное приложение.
 * Сначала очищаем папки и устанавливаем все модули
 */
gulp.task('build', ['build:npm', 'build:bower'/*, 'minify:css', 'minify:js'*/], function (done) {
  console.log('Сборка приложения завершена.');
  done();
});

function npm(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов бэкенда для пути ' + path);
      var error;
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

function onFinishConstructor(text, done) {
  return function () {
    console.log(text);
    done();
  };
}

function bower(p) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Установка пакетов фронтенда для пути ' + p);
      var error;
      try {
        process.chdir(p);
        if (fs.existsSync('.bowerrc')) {
          var bc = JSON.parse(fs.readFileSync('.bowerrc', {encoding: 'utf-8'}));
          gulp.src(['./' + bc.json])
          .pipe(install({args: ['--config.interactive=false']})).on('finish', function () {
            if (fs.existsSync(bc.directory)) {
              var vendorModules = fs.readdirSync(bc.directory);
              var dist, min, all, dest;
              for (var i = 0; i < vendorModules.length; i++) {
                all = true;
                dist = path.join(bc.directory, vendorModules[i], 'dist');
                min = path.join(bc.directory, vendorModules[i], 'min');
                dest = path.join(bc.vendorDir, vendorModules[i]);

                if (fs.existsSync(dist)) {
                  all = false;
                  gulp.src([path.join(dist, '**/*')]).pipe(gulp.dest(dest)).on('finish',
                    onFinishConstructor(
                      'Скопированы дистрибутивные файлы вендорского пакета ' + vendorModules[i],
                      resolve
                    ));
                }

                if (fs.existsSync(min)) {
                  all = false;
                  gulp.src([path.join(min, '**/*')]).pipe(gulp.dest(dest)).on('finish',
                    onFinishConstructor(
                      'Скопированы минифицированные файлы вендорского пакета ' + vendorModules[i],
                      resolve
                    )
                  );
                }

                if (all) {
                  gulp.src([path.join(bc.directory, vendorModules[i], '**/*')]).pipe(gulp.dest(dest)).on('finish',
                    onFinishConstructor(
                      'Скопированы файлы вендорского пакета ' + vendorModules[i],
                      resolve
                    )
                  );
                }
              }
            } else {
              resolve();
            }
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

gulp.task('build:npm', function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = npm(process.env.NODE_PATH)();
  for (var i = 0; i < modules.length; i++) {
    start = start.then(npm(path.join(modulesDir, modules[i])));
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done(err);
  });
});

gulp.task('build:bower', function (done) {
  var modulesDir = path.join(process.env.NODE_PATH, 'modules');
  var modules = fs.readdirSync(modulesDir);
  var start = bower(process.env.NODE_PATH)();
  for (var i = 0; i < modules.length; i++) {
    start = start.then(bower(path.join(modulesDir, modules[i])));
  }
  start.then(function () {
    process.chdir(process.env.NODE_PATH);
    done();
  }).catch(function (err) {
    console.error(err);
    done();
  });
});

function minCss(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Минификация css-файлов фронтенда для пути ' + path);
      var error;
      try {
        process.chdir(path);
        gulp.src([
          join(path, 'view/static/css/**/*.css'),
            join(path, 'view/static/vendor/css/**/*.css'),
          '!' + join(path, 'view/static/css/**/*.min.css')
        ])
          .pipe(sourcemaps.init())
          .pipe(autoprefixer(aprefConf))
          .pipe(minifyCSS())
          .pipe(rename({suffix: '.min'}))
          .pipe(sourcemaps.write('./maps'))
          .pipe(gulp.dest(join(config.path._public, config.folder._css)))
          .pipe(size({title: 'Total compressed CSS files (with source maps) size:'}));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}

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

function minJs(path) {
  return function () {
    return new Promise(function (resolve, reject) {
      console.log('Минификация js-файлов фронтенда для пути ' + path);
      var error;
      try {
        process.chdir(path);
        gulp.src(join(config.path._public, config.folder._js, config.file.mainJS))
          .pipe(sourcemaps.init())
          .pipe(stripDebug())
          .pipe(uglify())
          .pipe(rename({suffix: '.min'}))
          // For using ES6 .pipe(plugins.babel())
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(join(config.path._public, config.folder._js)))
          .pipe(size({title: 'Total compressed JavaScript files (with source maps) size:'}));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}

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
