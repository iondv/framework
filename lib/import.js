/**
 * Created by kras on 09.07.16.
 */

var fs = require('fs');
var path = require('path');


function processDir(dir, filter, handler) {
  var files, i, stat, fn;
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir);
    for (i = 0; i < files.length; i++) {
      fn = path.join(dir, files[i]);
      stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        processDir(fn, filter, handler);
      } else if (filter(files[i])) {
        handler(fn);
      }
    }
  }
}

/**
 * @param {String} src
 * @param {DbSync} sync
 * @param {DataRepository} dataRepo
 * @param {{}} options
 * @param {String} options.namespace
 * @returns {Promise}
 */
module.exports = function (src, sync, dataRepo, options) {

  var meta = function () {
    var promises = [];
    processDir(
      path.join(src, 'meta'),
      function (nm) {
        return nm.substr(-11) === '.class.json';
      },
      function (fn) {
        var cm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        promises.push(sync.defineClass(cm, options.namespace));
      }
    );
    if (promises.length) {
      return Promise.all(promises);
    }
    return new Promise(function (resolve, reject) {resolve();});
  };

  var vd = path.join(src, 'views');
  var views = function () {
    var promises = [];
    processDir(
      vd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        var vm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        var pth = path.parse(fn);
        var parts = path.relative(vd, pth.dir).split(path.delimiter);
        promises.push(sync.defineView(
            vm, // Объект модели представления
            parts[parts.length - 1], // Имя класса
            pth.name, // Тип представления
            parts.slice(0, parts.length - 1).join('.'), // Путь навигации
            options.namespace
          )
        );
      }
    );
    if (promises.length) {
      return Promise.all(promises);
    }
    return new Promise(function (resolve, reject) {resolve();});
  };

  var nd = path.join(src, 'navigation');
  var navigation = function () {
    var promises = [];
    processDir(
      nd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        if (fn.substr(-13) === '.section.json') {
          var s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          promises.push(sync.defineNavSection(s, options.namespace));
        } else {
          var n = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          var pth = path.parse(fn);
          promises.push(sync.defineNavNode(n, path.relative(nd, pth.dir), options.namespace));
        }
      }
    );
    if (promises.length) {
      return Promise.all(promises);
    }
    return new Promise(function (resolve, reject) {resolve();});
  };

  var dd = path.join(src, 'data');
  var data = function () {
    var promises = [];
    processDir(
      nd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        var obj = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        var parts = path.parse(fn).name.split('@');
        promises.push(
          dataRepo.saveItem(
            parts[0] + (options.namespace ? '@' + options.namespace : ''),
            (parts.length > 1) ? parts[1] : null,
            obj, null, 0));
      }
    );
    if (promises.length) {
      return Promise.all(promises);
    }
    return new Promise(function (resolve, reject) {resolve();});
  };

  return new Promise(function (resolve, reject) {
    meta().then(views).then(navigation).then(data).then(resolve).catch(reject);
  });
};
