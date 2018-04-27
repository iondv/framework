'use strict';
/**
 * Created by kras on 09.07.16.
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
 * @param {DbSync} options.sync
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {WorkflowProvider} options.workflows
 * @param {SequenceProvider} options.sequences
 * @param {Logger} options.log
 * @param {String} options.namespace
 * @param {Boolean} options.ignoreIntegrityCheck
 * @param {Array} options.skip - пропуск импорта определенных данных
 * @returns {Promise}
 */
module.exports = function (src, options) {

  function meta() {
    let metas = [];
    let mByName = {};

    let md = path.join(src, 'meta');
    if (fs.existsSync(md)) {
      processDir(
        md,
        (nm) => {
          return nm.substr(-11) === '.class.json';
        },
        (fn) => {
          let cm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          metas.push(cm);
          mByName[cm.name + '@' + (cm.namespace || options.namespace)] = cm;
        },
        (err) => {
          options.log.error(err);
        }
      );
    }

    function calcClassLevel(cm) {
      if (cm.ancestor) {
        let ancName = cm.ancestor;
        if (ancName.indexOf('@') < 0) {
          ancName = ancName + '@' + (cm.namespace || options.namespace || '');
        }

        let anc = null;

        if (mByName.hasOwnProperty(ancName)) {
          anc = mByName[ancName];
        } else {
          anc = options.metaRepo.getMeta(ancName, cm.version || null, cm.namespace || options.namespace || '');
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

    let promiseLevels = {};
    metas.forEach((m) => {
      let lvl = calcClassLevel(m);
      if (!promiseLevels.hasOwnProperty('l' + lvl)) {
        promiseLevels['l' + lvl] = {level: lvl, promises: []};
      }
      promiseLevels['l' + lvl].promises.push(() => options.sync.defineClass(m, options.namespace));
    });

    let execLevels = [];
    for (let lvl in promiseLevels) {
      if (promiseLevels.hasOwnProperty(lvl)) {
        execLevels.push(promiseLevels[lvl]);
      }
    }

    execLevels.sort((a, b) => { return a.level - b.level; });

    let worker = Promise.resolve();
    execLevels.forEach((lvl) => {
      worker = worker.then(() => {
        let p = Promise.resolve();
        for (let j = 0; j < lvl.promises.length; j++) {
          p = p.then(lvl.promises[j]);
        }
        return p;
      });
    });
    return worker;
  }

  let vd = path.join(src, 'views');
  function views() {
    let promise = Promise.resolve();
    if (fs.existsSync(vd)) {
      processDir(
        vd,
        (nm) => {
          return nm.substr(-5) === '.json';
        },
        (fn) => {
          try {
            let vm = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
            let pth = path.parse(fn);
            let parts = path.relative(vd, pth.dir).split(path.sep);
            let parts2 = pth.name.split('_');
            let type = parts2[0];
            if (parts[0] === 'workflows') {
              let cn = pth.name;
              if (cn.indexOf('@') < 0 && options.namespace) {
                cn = cn + '@' + options.namespace;
              }
              if (parts[1].indexOf('@') < 0) {
                parts[1] = parts[1] + '@' + options.namespace;
              }

              promise = promise.then(() => options.sync.defineView(
                vm, // Объект модели представления
                cn, // Имя класса
                'item', // Тип представления
                parts.join('.') // Путь навигации
              ));
            } else {
              let cn = parts[parts.length - 1];
              if (cn.indexOf('@') < 0 && options.namespace) {
                cn = cn + '@' + options.namespace;
              }
              if (parts[0].indexOf('@') < 0) {
                parts[0] = options.namespace + '@' + parts[0];
              }
              promise = promise.then(() => options.sync.defineView(
                vm, // Объект модели представления
                cn, // Имя класса
                type, // Тип представления
                parts.slice(0, parts.length - 1).join('.') // Путь навигации
                )
              );
            }
          } catch (e) {
            options.log.error(e);
          }
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  let nd = path.join(src, 'navigation');
  function navigation() {
    let promise = Promise.resolve();
    if (fs.existsSync(nd)) {
      processDir(
        nd,
        (nm) => {
          return nm.substr(-5) === '.json';
        },
        (fn) => {
          if (fn.substr(-13) === '.section.json') {
            let s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
            promise = promise.then(() => options.sync.defineNavSection(s, options.namespace));
          } else {
            let n = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
            let pth = path.parse(fn);
            promise = promise.then(() => options.sync.defineNavNode(n, path.relative(nd, pth.dir), options.namespace));
          }
        },
        (e) => {
          options.log.error(e);
        }
      );
    }
    return promise;
  }

  let wfd = path.join(src, 'workflows');
  function workflows() {
    let promise = Promise.resolve();
    if (fs.existsSync(wfd)) {
      processDir(
        wfd,
        (nm) => {
          return nm.substr(-5) === '.json';
        },
        (fn) => {
          let wf = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          let parts = path.basename(fn).replace(/\.wf\.json$/, '').split('@');
          if (parts.length > 1) {
            wf.namespace = wf.namespace || parts[1];
          }
          promise = promise.then(() => options.sync.defineWorkflow(wf, options.namespace));
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  let dd = path.join(src, 'data'); // Путь к папке данных

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
            //options.log.error(err);
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
          .catch((err)=> {
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
                ignoreIntegrityCheck: options.ignoreIntegrityCheck || false
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
            //options.log.error(err);
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
      return function () {
        let data = fs.readFileSync(zipName);
        let zip = new JSZip();
        return zip.loadAsync(data)
          .then((zipData) => {
            options.log.log(`Считали архив ${zipName}`);
            let filesList = Object.keys(zipData.files);
            let p = Promise.resolve();
            for (let i = 0; i < filesList.length; i++) {
              if (filesList[i].substr(-5) === '.json') {
                let msg = i && i % 1000 === 0 ?
                  `Импортировано ${i}/${filesList.length} объектов из архива ${zipName}` : null;
                p = p.then(setSavePromise(filesList[i], zipData, msg));
              }
            }
            return p;
          })
          .then(() => {
            options.log.info(`Импортированы объекты данных из архива ${zipName}.`);
          });
      };
    }

    let filesList = [];
    let zipList = [];

    processDir(dd, (nm) => {
      return nm.substr(-5) === '.json';
    }, (fn) => {
      filesList.push(fn);
    }, (err) => {
      options.log.error(err);
    });
    processDir(dd, (nm) => {
      return nm.substr(-4) === '.zip';
    }, (fnZip) => {
      zipList.push(fnZip);
    }, (err) => {
      options.log.error(err);
    });

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
            let snapshot = JSON.parse(fs.readFileSync(seq));
            let p = Promise.resolve();
            Object.keys(snapshot).forEach((nm) => {
              p = p.then(() => options.sequences.reset(nm, snapshot[nm]));
            });
            return p;
          }
        });
    } else {
      return Promise.resolve();
    }
  }

  function userTypes() {
    let promise = Promise.resolve();
    let utd = path.join(src, 'meta', 'types');
    if (fs.existsSync(utd)) {
      processDir(
        utd,
        (nm) => {
          return nm.substr(-10) === '.type.json';
        },
        (fn) => {
          let s = JSON.parse(fs.readFileSync(fn), {encoding: 'utf-8'});
          promise = promise.then(() => options.sync.defineUserType(s));
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  return options.sync.init()
    .then(meta)
    .then(userTypes)
    .then(views)
    .then(navigation)
    .then(workflows)
    .then((res) => {
      if (options.skip && options.skip.indexOf('data') !== -1) {
        options.log.info('Пропущен импорт данных в БД');
        return res;
      } else {
        return data(res);
      }
    });
};
