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
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @param {{}} options
 * @param {String} options.namespace
 * @returns {Promise}
 */
module.exports = function (src, sync, metaRepo, dataRepo, options) {

  var meta = function () {
    var metas = [];
    var mByName = {};
    var i, lvl;

    processDir(
      path.join(src, 'meta'),
      function (nm) {
        return nm.substr(-11) === '.class.json';
      },
      function (fn) {
        var cm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        metas.push(cm);
        mByName[cm.name] = cm;
      }
    );

    function defineClass(cm) {
      return function () {
        return sync.defineClass(cm, options.namespace);
      };
    }

    function calcClassLevel(cm) {
      if (cm.ancestor) {
        var anc = null;
        if (mByName.hasOwnProperty(cm.ancestor)) {
          anc = mByName[cm.ancestor];
        } else {
          anc = metaRepo.getMeta(cm.ancestor, cm.version || null, options.namespace || '');
          if (anc) {
            anc = anc.plain;
          }
        }

        if (anc) {
          return 1 + calcClassLevel(anc);
        }
      }
      return 0;
    }

    var promiseLevels = {};
    for (i = 0; i < metas.length; i++) {
      lvl = calcClassLevel(metas[i]);
      if (!promiseLevels.hasOwnProperty('l' + lvl)) {
        promiseLevels['l' + lvl] = {level: lvl, promises: []};
      }
      promiseLevels['l' + lvl].promises.push(defineClass(metas[i]));
    }

    var execLevels = [];
    for (lvl in promiseLevels) {
      if (promiseLevels.hasOwnProperty(lvl)) {
        execLevels.push(promiseLevels[lvl]);
      }
    }

    execLevels.sort(function (a, b) { return a.level - b.level; });

    function levelPromise(lvl) {
      return function () {
        var promises = [];
        for (var j = 0; j < lvl.promises.length; j++) {
          promises.push(lvl.promises[j]());
        }
        return Promise.all(promises);
      };
    }

    return new Promise(function (resolve, reject) {
      var worker = null;
      for (var i = 0; i < execLevels.length; i++) {
        if (!worker) {
          worker = levelPromise(execLevels[i])();
        } else {
          worker = worker.then(levelPromise(execLevels[i]));
        }
      }
      if (worker) {
        worker.then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
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
        var parts2 = pth.name.split('_');
        var type = parts2[0];
        promises.push(sync.defineView(
            vm, // Объект модели представления
            parts[parts.length - 1], // Имя класса
            type, // Тип представления
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
      dd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        var obj = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        var parts = path.parse(fn).name.split('@');
        promises.push(
          function () {
            return dataRepo.saveItem(
              parts[0] + (options.namespace ? '@' + options.namespace : ''),
              parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null,
              obj, obj._classVer || null, null, 0);
          }
        );
      }
    );
    if (promises.length) {
      return new Promise(function (resolve, reject) {
        metaRepo.init().then(function () {
          var tmp = [];
          for (var i = 0; i < promises.length; i++) {
            tmp.push(promises[i]());
          }
          return Promise.all(tmp);
        }).then(resolve).catch(reject);
      });
    }
    return new Promise(function (resolve) {resolve();});
  };

  return new Promise(function (resolve, reject) {
    sync.init().
    then(meta).
    then(views).
    then(navigation).
    then(data).
    then(resolve).
    catch(reject);
  });
};
