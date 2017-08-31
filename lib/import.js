/**
 * Created by kras on 09.07.16.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const base64 = require('base64-js');
const buf = require('core/buffer');

// jshint maxcomplexity: 40
function chain(p , cb) {
  return p ? p.then(cb) : cb();
}


/**
 * @param {String} src
 * @param {DbSync} sync
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @param {Logger} log
 * @param {{}} options
 * @param {String} options.namespace
 * @param {Boolean} options.ignoreIntegrityCheck
 * @returns {Promise}
 */
module.exports = function (src, sync, metaRepo, dataRepo, log, options) {

  function processDir(dir, filter, handler) {
    var files, i, stat, fn;
    try {
      fs.accessSync(dir, fs.constants.F_OK);
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
    } catch (e) {
      log.warn(`Отсутствует дирректория импорта ${dir}`);
    }
  }

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
        var p;
        for (var j = 0; j < lvl.promises.length; j++) {
          if (p) {
            p = p.then(lvl.promises[j]);
          } else {
            p = lvl.promises[j]();
          }
        }
        return p || Promise.resolve();
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
    let promise = null;
    processDir(
      vd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        try {
          let vm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          let pth = path.parse(fn);
          let parts = path.relative(vd, pth.dir).split(path.sep);
          let parts2 = pth.name.split('_');
          let type = parts2[0];
          if (parts[0] === 'workflows') {
            promise = chain(promise, () => sync.defineView(
              vm, // Объект модели представления
              pth.name, // Имя класса
              'item', // Тип представления
              parts.join('.'), // Путь навигации
              options.namespace
            ));
          } else {
            promise = chain(promise, () => sync.defineView(
              vm, // Объект модели представления
              parts[parts.length - 1], // Имя класса
              type, // Тип представления
              parts.slice(0, parts.length - 1).join('.'), // Путь навигации
              options.namespace
              )
            );
          }
        } catch (e) {
          log.error(`При импорте возникла ошибка парсинга файла ${fn}. Импорт пропущен`);
        }
      }
    );
    return promise || Promise.resolve();
  };

  var nd = path.join(src, 'navigation');
  var navigation = function () {
    let promise = null;
    processDir(
      nd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        if (fn.substr(-13) === '.section.json') {
          let s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          promise = chain(promise, () => sync.defineNavSection(s, options.namespace));
        } else {
          let n = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          let pth = path.parse(fn);
          promise = chain(promise, () => sync.defineNavNode(n, path.relative(nd, pth.dir), options.namespace));
        }
      }
    );
    return promise || Promise.resolve();
  };

  var wfd = path.join(src, 'workflows');
  var workflows = function () {
    let promise = null;
    processDir(
      wfd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        var wf = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        promise = chain(promise, () => sync.defineWorkflow(wf, options.namespace));
      }
    );
    return promise || Promise.resolve();
  };

  var dd = path.join(src, 'data'); // Путь к папке данных

  /**
   * Импорт данных из папки приложения data и архива data/data.zip
   * @returns {Promise} - возвращает результат promise всех записей, или catch первой сбойной
   */
  var data = function () {
    function fileParser(key, value) {
      if (typeof value === 'object' && value) {
        if (value._type === '$$FILE$$') {
          if (value.buffer) {
            value.buffer = buf(base64.toByteArray(value.buffer));
          }
        }

        if (value.path && (value._type === '$$FILE$$' || value.name && value.options)) {
          value.path = path.join(dd, value.path);
        }

        delete value._type;
      }
      return value;
    }

    function fileItemSaver(fn, msg) {
      return function () {
        let obj = JSON.parse(fs.readFileSync(fn, {encoding: 'utf-8'}), fileParser);
        let parts = path.parse(decodeURIComponent(fn)).name.split('@');
        let cn = parts[0] + (options.namespace ? '@' + options.namespace : '');
        let id = parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null;
        return dataRepo.saveItem(
          cn,
          id,
          obj, obj._classVer || null, null, {
            skipResult: true, nestingDepth: 0, autoAssign: true,
            ignoreIntegrityCheck: options.ignoreIntegrityCheck || false
          })
          .then(() => {
            if (msg) {
              log.info(msg);
            }
            return Promise.resolve();
          })
          .catch((err) => {
            log.warn(err.message || err);
            if (msg) {
              log.info(msg);
            }
            return Promise.resolve();
          });
      };
    }

    /**
     * Рекурсиваня запись объектов данных партиями
     * @param {Array} filesList - массив имен файлов
     * @return {Promise} Promise - результат записи в виде Promise
     */
    function saveIterationFileList(filesList) {
      let p = null;
      for (var i = 0; i < filesList.length; i++) {
        let msg = i && i % 1000 === 0 ? `Обработано ${i} из ${filesList.length} объектов` : null;
        p = p ? p.then(fileItemSaver(filesList[i], msg)) : fileItemSaver(filesList[i], msg)();
      }
      return p || Promise.resolve();
    }

    /**
     * Распаковка, распарсивание и формирование промиза сохранения объекта
     * @param {String} filename - имя файла в архиве
     * @param {Object} zipData - распарсенный объект архива
     * @returns {Promise.<T>}
     */
    function setSavePromise(filename, zipData, successMessage) {
      return function () {
        return zipData
          .file(filename)
          .async('string')
          .catch((err)=> {
            log.warn(`Ошибка распаковки файла ${filename}`);
            log.err(err);
            return Promise.reject(err);
          })
          .then((content) => {
            let obj = JSON.parse(content, fileParser);
            let parts = path.parse(filename).name.split('@');
            return dataRepo.saveItem(
              parts[0] + (options.namespace ? '@' + options.namespace : ''),
              parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null,
              obj, obj._classVer || null, null, {
                skipResult: true, nestingDepth: 0, autoAssign: true,
                ignoreIntegrityCheck: options.ignoreIntegrityCheck || false
              });
          })
          .then(() => {
            if (successMessage) {
              log.info(successMessage);
            }
            return Promise.resolve();
          })
          .catch((err) => {
            log.warn(err.message || err);
            if (successMessage) {
              log.info(successMessage);
            }
            return Promise.resolve();
          });
      };
    }

    /**
     * Функция записи партиями файлов из архивов
     * @param {Array} zipName - список архивов
     * @returns {Promise}
     */
    function saveIterationZip(zipName) {
      return function () {
        let data = fs.readFileSync(zipName);
        let zip = new JSZip();
        return zip.loadAsync(data)
          .then((zipData) => {
            log.log(`Считали архив ${zipName}`);
            let filesList = Object.keys(zipData.files);
            let p = null;
            for (let i = 0; i < filesList.length; i++) {
              if (filesList[i].substr(-5) === '.json') {
                let msg = i && i % 1000 === 0 ?
                  `Импортировано ${i}/${filesList.length} объектов из архива ${zipName}` : null;
                p = p ?
                  p.then(setSavePromise(filesList[i], zipData, msg)) :
                  setSavePromise(filesList[i], zipData, msg)();
              }
            }
            if (!p) {
              return Promise.resolve();
            }
            return p;
          })
          .then(() => {
            log.info(`Импортированы объекты данных из архива ${zipName}.`);
            return Promise.resolve();
          });
      };
    }

    let filesList = [];
    let zipList = [];
    processDir(dd, (nm) => {return nm.substr(-5) === '.json';}, (fn) => {filesList.push(fn);});
    processDir(dd, (nm) => {return nm.substr(-4) === '.zip';}, (fnZip) => {zipList.push(fnZip);});

    log.info(`Кол-во импортируемых объектов данных ${filesList.length}, кол-во архивов ${zipList.length}`);
    if (filesList.length || zipList.length) {
      return metaRepo.init()
        .then(function () { // Импортируем из файлов
          return saveIterationFileList(filesList, 0);
        })
        .then(function () { // Импортируем из архивов
          var p = null;
          for (let i = 0; i < zipList.length; i++) {
            p = p ? p.then(saveIterationZip(zipList[i])) : saveIterationZip(zipList[i])();
          }
          return p ? p : Promise.resolve();
        });
    } else {
      return Promise.resolve();
    }
  };

  function userTypes() {
    let promise = null;
    processDir(
      path.join(src, 'meta', 'types'),
      function (nm) {
        return nm.substr(-10) === '.type.json';
      },
      function (fn) {
        let s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        promise = chain(promise, () => sync.defineUserType(s));
      }
    );
    return promise || Promise.resolve();
  }

  return sync.init()
      .then(meta)
      .then(userTypes)
      .then(views)
      .then(navigation)
      .then(workflows)
      .then(data);
};
