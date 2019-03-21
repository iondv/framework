/* eslint no-sync:off */
/**
 * Created by krasilneg on 21.03.19.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const base64 = require('base64-js');
const buf = require('core/buffer');
const {processDir} = require('core/util/read');

/**
 * @param {String} src
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {WorkflowProvider} options.workflows
 * @param {SequenceProvider} options.sequences
 * @param {Logger} options.log
 * @param {Boolean} options.ignoreIntegrityCheck
 * @param {String} options.namespace
 * @returns {Promise}
 */
module.exports = function (src, options) {

  const dd = src; // Путь к папке данных

  function seqImport(snapshot) {
    let p = Promise.resolve();
    Object.keys(snapshot).forEach((nm) => {
      p = p.then(() => options.sequences.reset(nm, snapshot[nm]));
    });
    return p;
  }

  /**
   * Импорт данных из папки приложения data и архива data/data.zip
   * @returns {Promise} - возвращает результат promise всех записей, или catch первой сбойной
   */
  function data() {
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
        let wf = obj.___workflowStatus;
        delete obj.___workflowStatus;
        let parts = path.parse(decodeURIComponent(fn)).name.split('@');
        let ns = options.namespace;
        if (parts.length > 2) {
          ns = parts[1];
        }
        let cn = parts[0] + (ns ? '@' + ns : '');
        let id = parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null;
        return options.dataRepo.saveItem(
          cn,
          id,
          obj, obj._classVer || null, null, {
            nestingDepth: 0, autoAssign: true,
            adjustAutoInc: true, skipCacheRefresh: true,
            ignoreIntegrityCheck: options.ignoreIntegrityCheck || false,
            skipResult: wf ? false : true
          })
          .then((item) => {
            let p = Promise.resolve();
            if (wf && item) {
              Object.keys(wf).forEach((w) => {
                p = p.then(() => options.workflows.pushToState(item, w, wf[w].stage));
              });
            }
            return p;
          })
          .then(() => {
            if (msg) {
              options.log.info(msg);
            }
          })
          .catch((err) => {
            if (err.cause) {
              options.log.warn(err.cause.message || err.cause);
            }
            options.log.warn(err.message || err);
            if (msg) {
              options.log.info(msg);
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
      let p = Promise.resolve();
      for (let i = 0; i < filesList.length; i++) {
        let msg = i && i % 1000 === 0 ? `Обработано ${i} из ${filesList.length} объектов` : null;
        p = p.then(fileItemSaver(filesList[i], msg));
      }
      return p;
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
          .catch((err) => {
            options.log.warn(`Ошибка распаковки файла ${filename}`);
            options.log.err(err);
            return Promise.reject(err);
          })
          .then((content) => {
            let obj = JSON.parse(content, fileParser);
            let wf = obj.___workflowStatus;
            delete obj.___workflowStatus;

            let parts = path.parse(filename).name.split('@');
            let ns = options.namespace;
            if (parts.length > 2) {
              ns = parts[1];
            }
            return options.dataRepo.saveItem(
              parts[0] + (ns ? '@' + ns : ''),
              parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null,
              obj, obj._classVer || null, null,
              {
                nestingDepth: 0, autoAssign: true,
                adjustAutoInc: true, skipCacheRefresh: true,
                ignoreIntegrityCheck: options.ignoreIntegrityCheck || false,
                skipResult: wf ? false : true
              }
            ).then((item) => {
              let p = Promise.resolve();
              if (wf) {
                Object.keys(wf).forEach((w) => {
                  p = p.then(() => options.workflows.pushToState(item, w, wf[w].stage));
                });
              }
              return p;
            });
          })
          .then(() => {
            if (successMessage) {
              options.log.info(successMessage);
            }
          })
          .catch((err) => {
            //options.log.warn(err.message || err);
            if (err.cause) {
              options.log.warn(err.cause.message || err.cause);
            }
            options.log.warn(err.message || err);
            if (successMessage) {
              options.log.info(successMessage);
            }
          });
      };
    }

    /**
     * Функция записи партиями файлов из архивов
     * @param {Array} zipName - список архивов
     * @returns {Promise}
     */
    function saveIterationZip(zipName) {
      return () => {
        let data = fs.readFileSync(zipName);
        let zip = new JSZip();
        return zip.loadAsync(data)
          .then((zipData) => {
            options.log.log(`Считали архив ${zipName}`);
            let filesList = Object.keys(zipData.files);
            let p = Promise.resolve();
            filesList.forEach((fn, i) => {
              if (fn.substr(-5) === '.json') {
                let msg = i && i % 1000 === 0 ?
                  `Импортировано ${i}/${filesList.length} объектов из архива ${zipName}` : null;
                p = p.then(setSavePromise(fn, zipData, msg));
              } else if (fn === 'sequences.data') {
                p = p.then(
                  () =>
                    zipData
                      .file(fn)
                      .async('string')
                      .then((content) => {
                        let snapshot = JSON.parse(content, fileParser);
                        return seqImport(snapshot);
                      })
                      .catch((err) => {
                        options.log.warn(`Ошибка распаковки файла ${fn}`);
                        options.log.err(err);
                      })
                );
              }
            });
            return p;
          })
          .then(() => {
            options.log.info(`Импортированы объекты данных из архива ${zipName}.`);
          });
      };
    }

    let filesList = [];
    let zipList = [];

    processDir(
      dd,
      nm => nm.substr(-5) === '.json',
      (fn) => {
        filesList.push(fn);
      },
      (err) => {
        options.log.error(err);
      }
    );
    processDir(
      dd,
      nm => nm.substr(-4) === '.zip',
      (fnZip) => {
        zipList.push(fnZip);
      },
      (err) => {
        options.log.error(err);
      }
    );

    options.log.info(`Кол-во импортируемых объектов данных ${filesList.length}, кол-во архивов ${zipList.length}`);
    if (filesList.length || zipList.length) {
      return options.metaRepo.init()
        .then(() => saveIterationFileList(filesList, 0))
        .then(() => { // Импортируем из архивов
          let p = Promise.resolve();
          for (let i = 0; i < zipList.length; i++) {
            p = p.then(saveIterationZip(zipList[i]));
          }
          return p;
        })
        .then(() => {
          let seq = path.join(dd, 'sequences.data');
          if (fs.existsSync(seq)) {
            let snapshot = {};
            try {
              snapshot = JSON.parse(fs.readFileSync(seq));
            } catch (err) {
              err.message = 'Ошибка парсинга ' + seq + 'Проставляем пустым \n' + err.message;
              options.log.error(err);
            }
            return seqImport(snapshot);
          }
        });
    } else {
      return Promise.resolve();
    }
  }

  return data();
};
