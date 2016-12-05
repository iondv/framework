/**
 * Created by kras on 09.07.16.
 */

var fs = require('fs');
var path = require('path');
var JSZip = require('jszip');

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
    console.warn('Отсутствует дирректория импорта', dir);
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
        try {
          var vm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          var pth = path.parse(fn);
          var parts = path.relative(vd, pth.dir).split(path.sep);
          var parts2 = pth.name.split('_');
          var type = parts2[0];
          if (parts[0] === 'workflows') {
            promises.push(sync.defineView(
              vm, // Объект модели представления
              pth.name, // Имя класса
              'item', // Тип представления
              parts.join('.'), // Путь навигации
              options.namespace
              )
            );
          } else {
            promises.push(sync.defineView(
              vm, // Объект модели представления
              parts[parts.length - 1], // Имя класса
              type, // Тип представления
              parts.slice(0, parts.length - 1).join('.'), // Путь навигации
              options.namespace
              )
            );
          }
        } catch (e) {
          console.error('При импорте возникла ошибка парсинга файла %s. Импорт пропущен', fn);
        }
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

  var wfd = path.join(src, 'workflows');
  var workflows = function () {
    var promises = [];
    processDir(
      wfd,
      function (nm) {
        return nm.substr(-5) === '.json';
      },
      function (fn) {
        var wf = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        promises.push(sync.defineWorkflow(
          wf,
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

  var dd = path.join(src, 'data'); // Путь к папке данных

  /**
   * Импорт данных из папки приложения data и архива data/data.zip
   * @returns {Promise} - возвращает результат promise всех записей, или catch первой сбойной
   */
  var data = function () {
    const SAVE_RANGE = 100; // Нужно уменьшить, если при импорте объектов выдается ошибка нехватки памяти или нехватки старой памяти JavaScript heap out of memory
    /**
     * Рекурсиваня запись объектов данных партиями
     * @param {Array} filesList - массив имен файлов
     * @param {Number} start - стартовая позиция для записи
     * @return {Promise} Promise - результат записи в виде Promise
     */
    function saveIterationFileList(filesList, start) {
      start = start ? start : 0;
      let savePromises = [];
      let finish = start + SAVE_RANGE < filesList.length ?  start + SAVE_RANGE : filesList.length;
      for (var i = start; i < finish; i++) {
        let obj = JSON.parse(fs.readFileSync(filesList[i]), {encoding: 'utf-8'});
        let parts = path.parse(filesList[i]).name.split('@');
        let tmp = dataRepo.saveItem(
          parts[0] + (options.namespace ? '@' + options.namespace : ''),
          parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null,
          obj, obj._classVer || null, null, {nestingDepth: 0, autoAssign: true});
        savePromises.push(tmp); // Формируем массив с promise для запуска сохранения
      }
      return Promise.all(savePromises)
        .then((res) => {
          for (let i = 0; i < savePromises.length; i++) {// Удаляем объекты - для очистки занимаемой объектами памяти
            delete savePromises[i];
          }
          savePromises = null; // Очищаем массив
          if (finish === filesList.length || finish / 1000 === Math.round(finish / 1000)) { // Показываем только тысячи импорированных данных или финиш импорта
            console.info('Импортирована партия по %s объектов данных. Всего %s/%s', SAVE_RANGE, finish,
              filesList.length);
          }
          if (finish < filesList.length) {
            return saveIterationFileList(filesList, start + SAVE_RANGE);
          } else {
            return res;
          }
        })
        .catch((err) => {
          return err;
        });
    }

    /**
     * Распаковка, распарсивание и формирование промиза сохранения объекта
     * @param {String} filename - имя файла в архиве
     * @param {Object} zipData - распарсенный объект архива
     * @returns {Promise.<T>}
     */
    function setSavePromise(filename, zipData) {
      return zipData
        .file(filename)
        .async('string')
        .then((content) => {
          let obj = JSON.parse(content);
          let parts = path.parse(filename).name.split('@');
          return dataRepo.saveItem(
            parts[0] + (options.namespace ? '@' + options.namespace : ''),
            parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null,
            obj, obj._classVer || null, null, {nestingDepth: 0, autoAssign: true});
        })
        .catch ((err)=> {
          console.error('Ошибка распаковки файла', filename);
          return err;
        });
    }

    /**
     * Функция записи партиями файлов из архивов
     * @param {Array} zipList - список архивов
     * @param {Number} start - стартовая позиция номера файла в архиве
     * @param {Number} numZip - номер zip файла в списке архивов
     * @param {Object} zipData - распарсенный объекта архива zip
     * @returns {*}
     */
    function saveIterationZip(zipList, start, numZip, zipData) {
      start = start ? start : 0;
      numZip = numZip ? numZip : 0;
      let savePromises = [];
      if (!zipData) {
        let data = fs.readFileSync(zipList[numZip]);
        let zip = new JSZip();
        return zip.loadAsync(data)
          .then((res) => {
            zipData = res;
            console.log('Считали архив', zipList[numZip]);
            data = null; // Очистили данные файла
            return saveIterationZip(zipList, start, numZip, zipData);
          })
          .catch((err) => {
            return err;
          });
      } else {
        let filesList = Object.keys(zipData.files);
        let finish = start + SAVE_RANGE < filesList.length ?  start + SAVE_RANGE : filesList.length;
        let finishZip = finish === filesList.length ? true : false;
        for (var i = start; i < finish; i++) {
          if (filesList[i].substr(-5) === '.json') {
            let zipPush = setSavePromise(filesList[i], zipData);
            savePromises.push(zipPush);
          }
        }
        return Promise.all(savePromises)
          .then((res) => {
            for (let i = 0; i < savePromises.length; i++) {// Удаляем объекты - для очистки занимаемой объектами памяти
              delete savePromises[i];
            }
            savePromises = null; // Очищаем массив
            if (finish === filesList.length || finish / 1000 === Math.round(finish / 1000)) { // Показываем только тысячи импорированных данных или финиш импорта
              console.info('Импортирована партия по %s объектов данных из архива %s. Всего %s/%s', SAVE_RANGE,
                zipList[numZip], finish, filesList.length);
            }
            if (finish < filesList.length) {
              return saveIterationZip(zipList, finish, numZip, zipData);
            } else if (finishZip && numZip + 1 < zipList.length) {
              zipData = null; // Очищаем память занимаемую архивом
              numZip++;
              return saveIterationZip(zipList, 0, numZip);
            } else {
              zipData = null; // Очищаем память занимаемую архивом
              return res;
            }
          })
          .catch((err) => {
            console.error('Ошибка сохранения партии объектов', zipList[numZip], savePromises.length, start, finish);
            return err;
          });
      }
    }

    let filesList = [];
    let zipList = [];
    processDir(dd, (nm) => {return nm.substr(-5) === '.json';}, (fn) => {filesList.push(fn);});
    processDir(dd, (nm) => {return nm.substr(-4) === '.zip';}, (fnZip) => {zipList.push(fnZip);});

    console.info('Кол-во импортируемых объектов данных %s, кол-во архивов', filesList.length, zipList.length);
    if (filesList.length || zipList.length) {
      return new Promise(function (resolve, reject) {
        metaRepo.init()
          .then(function () { // Импортируем из файлов
            return saveIterationFileList(filesList, 0);
          })
          .then(function (res) { // Импортируем из архивов
            if (zipList.length) {
              return saveIterationZip(zipList, 0, 0);
            } else {
              return res;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    } else {
      return new Promise(function (resolve) {resolve();});
    }
  };

  var userTypes = function () {
    var promises = [];
    processDir(
      path.join(src, 'meta', 'types'),
      function (nm) {
        return nm.substr(-10) === '.type.json';
      },
      function (fn) {
        var s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
        promises.push(sync.defineUserType(s));
      }
    );
    if (promises.length) {
      return Promise.all(promises);
    }
    return new Promise(function (resolve) {resolve();});
  };

  return new Promise(function (resolve, reject) {
    sync.init()
      .then(meta)
      .then(views)
      .then(navigation)
      .then(workflows)
      .then(data)
      .then(userTypes)
      .then(resolve)
      .catch(reject);
  });
};
