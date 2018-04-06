'use strict';
/**
 * Created by kras on 12.07.16.
 */
const fs = require('fs');
const path = require('path');
const clone = require('clone');
const mkdirp = require('mkdirp');
const PropertyTypes = require('core/PropertyTypes');
const base64 = require('base64-stream');
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;

// jshint maxstatements: 30, maxcomplexity: 20

function readFile(f) {
  if (!(f instanceof StoredFile)) {
    return Promise.resolve(f);
  }
  return f.getContents()
    .then((f) => {
      return new Promise((resolve, reject) => {
        let result = '';
        f.stream.pipe(base64.encode())
          .on(
            'data',
            (data) => {
              result += data;
            }
          )
          .on(
            'end',
            () => {
              resolve({
                _type: '$$FILE$$',
                name: f.name,
                options: f.options || {},
                buffer: result
              });
            }
          )
          .on('error', reject);
      });
    });
}

function formPath(dest, name, counter, cb) {
  let ext = path.extname(name);
  let nm = path.basename(name, ext) + (counter || '');
  let pth = path.join(dest, nm + ext);
  fs.access(pth, fs.constants.F_OK, (err) => {
    if (err) {
      return cb(null, pth);
    }
    formPath(dest, name, (counter || 0) + 1, cb);
  });
}

function exportFile(f, dst, fileDir) {
  if (!(f instanceof StoredFile)) {
    return Promise.resolve(f);
  }
  return f.getContents()
    .then(
      (f) => {
        return new Promise((resolve, reject) => {
          formPath(path.join(dst, fileDir), f.name, 0, (err, pth) => {
            let w = fs.createWriteStream(pth);
            f.stream.pipe(w);
            w.on('close', () => {
              resolve({
                _type: '$$FILE$$',
                name: f.name,
                options: f.options || {},
                path: path.relative(dst, pth)
              });
            }).on('error', reject);
          });
        });
      });
}

/**
 * @param {String} dst
 * @param {Item} item
 * @param {String} [fileDir]
 * @returns {Function}
 */
function writeObject(dst, item, fileDir) {
  return function (wfstatus) {
    let obj = clone(item.base);
    delete obj._id;
    obj.___workflowStatus = wfstatus.stages;

    let fileLoaders = Promise.resolve();
    let props = item.getProperties();
    Object.keys(props).forEach((pn) => {
      let prop = props[pn];
      if (
        prop.getType() === PropertyTypes.FILE ||
        prop.getType() === PropertyTypes.IMAGE
      ) {
        let f = prop.getValue();
        if (f) {
          if (fileDir) {
            fileLoaders = fileLoaders.then(() => exportFile(f, dst, fileDir));
          } else {
            fileLoaders = fileLoaders.then(() => readFile(f));
          }
          fileLoaders = fileLoaders.then((f) => {
            obj[pn] = f;
          });
        }
      } else if (prop.getType() === PropertyTypes.FILE_LIST) {
        let files = prop.getValue();
        if (Array.isArray(files)) {
          obj[pn] = [];
          files.forEach((f) => {
            if (fileDir) {
              fileLoaders = fileLoaders.then(() => exportFile(f, dst, fileDir));
            } else {
              fileLoaders = fileLoaders.then(() => readFile(f));
            }
            fileLoaders = fileLoaders.then((f) => {
              obj[pn].push(f);
            });
          });
        }
      }
    });

    return fileLoaders.then(() => {
      return new Promise((resolve, reject) => {
        var fn = path.join(dst, item.getClassName() + '@' + encodeURIComponent(item.getItemId()) + '.json');
        fs.writeFile(fn, JSON.stringify(obj, null, 2), {encoding: 'utf-8'}, function (err) {
          if (err) {
            return reject(err);
          }
          console.log('Записан файл данных ' + fn);
          resolve();
        });
      });
    });
  };
}

/**
 * @param {String} dst
 * @param {DataRepository} dataRepo
 * @param {WorkflowProvider} workflows
 * @param {ClassMeta} cm
 * @param {String} [fileDir]
 * @param {Number} [offset]
 * @returns {Promise}
 */
function exportData(dst, dataRepo, workflows, cm, fileDir, offset) {
  return function () {
    var ofst = offset ? offset : 0;
    mkdirp.sync(dst);
    if (fileDir) {
      mkdirp.sync(path.join(dst, fileDir));
    }
    return dataRepo.getList(
        cm.getCanonicalName(),
        {
          offset: ofst,
          count: 100,
          nestingDepth: 0
        }
    ).then(
      (list) => {
        let w = Promise.resolve();
        list.forEach((item) => {
          w = w.then(() => workflows.getStatus(item, {})).then(writeObject(dst, item, fileDir));
        });
        if (list.length === 100) {
          return w.then(exportData(dst, dataRepo, workflows, cm, fileDir, ofst + 100));
        } else {
          return w;
        }
      }
    );
  };
}

function exportNode(dst, node, paths) {
  paths.push(node.code);
  let n = clone(node);
  delete n.children;
  delete n._id;
  let fn = path.join(dst, node.code + '.json');
  fs.writeFileSync(fn, JSON.stringify(n, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл узла навигации ' + fn);
  for (let i = 0; i < node.children.length; i++) {
    exportNode(dst, node.children[i], paths);
  }
}

function exportSection(dst, section, paths) {
  let sect = clone(section);
  delete sect.nodes;
  delete sect._id;
  mkdirp.sync(dst);
  var fn = path.join(dst, section.namespace + '@' + section.name + '.section.json');
  fs.writeFileSync(fn, JSON.stringify(sect, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл секции навигации ' + fn);
  var dirName = path.join(dst, section.namespace + '@' + section.name);
  mkdirp.sync(dirName);
  for (let nm in section.nodes) {
    if (section.nodes.hasOwnProperty(nm)) {
      exportNode(dirName, section.nodes[nm], paths);
    }
  }
}

function exportViewModel(className, dst, vm) {
  let v = clone(vm);
  delete v.type;
  delete v.path;
  delete v.className;
  delete v.namespace;
  delete v._id;
  mkdirp.sync(path.join(
    dst,
    vm.path ? vm.path.replace('.', path.delimiter) : '',
    className));

  let fn = path.join(
    dst,
    vm.path ? vm.path.replace('.', path.delimiter) : '',
    className,
    vm.type + (vm.version ? '_' + vm.version : '') + '.json'
  );
  fs.writeFileSync(
    fn,
    JSON.stringify(v, null, 2),
    {encoding: 'utf-8'}
  );
  console.log('Записан файл модели представления ' + fn);
}

function exportViewModels(cm, dst, paths, fetcher) {
  let vm = fetcher(cm.getCanonicalName(), null, cm.version);
  mkdirp.sync(dst);
  if (vm) {
    exportViewModel(cm.getCanonicalName(), dst, vm);
  }

  for (let i = 0; i < paths.length; i++) {
    let vm = fetcher(cm.getCanonicalName(), paths[i], cm.version);
    if (vm && vm.path) {
      exportViewModel(cm.getCanonicalName(), dst, vm);
    }
  }
}

/**
 * @param {String} dst
 * @param {ClassMeta} cm
 * @param {String[]} paths
 * @param {MetaRepository} metaRepo
 * @param {Boolean} [noVersion]
 */
function exportClass(dst, cm, paths, metaRepo, noVersion) {
  let c = clone(cm.plain);
  delete c._id;
  mkdirp.sync(path.join(dst, 'meta'));
  let fn = path.join(dst, 'meta', cm.getCanonicalName() + (cm.getVersion() && !noVersion ? '_' + cm.getVersion() : '') + '.class.json');
  fs.writeFileSync(fn, JSON.stringify(c, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл мета-класса ' + fn);

  let viewsDir = path.join(dst, 'views');
  exportViewModels(cm, viewsDir, paths, (className, path, version) => {
    return metaRepo.getItemViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, (className, path, version) => {
    return metaRepo.getCreationViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, (className, path, version) => {
    return metaRepo.getListViewModel(className, path, version);
  });
}

/**
 * @param {String} dst
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {WorkflowProvider} options.workflows
 * @param {String} options.namespace
 * @param {String} options.version
 * @param {Boolean} [options.skipData]
 * @param {Boolean} [options.lastVersion]
 * @param {Boolean} [options.fileDir]
 * @returns {Promise}
 */
module.exports = function (dst, options) {
  return options.metaRepo.init()
    .then(() => {
      let paths = [];
      let dataPromises = Promise.resolve();
      // Экспорт навигации
      let sections = options.metaRepo.getNavigationSections(options.namespace);
      for (let nm in sections) {
        if (sections.hasOwnProperty(nm)) {
          exportSection(path.join(dst, 'navigation'), sections[nm], paths);
        }
      }
      mkdirp.sync(path.join(dst, 'workflows'));
      // Экспорт меты и моделей представления и формирование промисов экспорта данных
      let metas = options.metaRepo.listMeta(null, options.version, false, options.namespace);
      metas.forEach((cm) => {
        exportClass(dst, cm, paths, options.metaRepo, options.lastVersion);
        let workflows = options.metaRepo.getWorkflows(cm.getCanonicalName());
        workflows.forEach((wf) => {
          let fn = path.join(dst, 'workflows', wf.name + '@' + wf.namespace + '.wf.json');
          fs.writeFileSync(
            fn,
            JSON.stringify(wf, null, 2),
            {encoding: 'utf-8'}
          );
        });
        if (!options.skipData) {
          dataPromises = dataPromises
            .then(exportData(path.join(dst, 'data'), options.dataRepo, options.workflows, cm, options.fileDir));
        }
      });

      return dataPromises;
    });
};
