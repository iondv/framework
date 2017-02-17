/**
 * Created by kras on 12.07.16.
 */
const fs = require('fs');
const path = require('path');
const clone = require('clone');
const mkdirp = require('mkdirp');
const PropertyTypes = require('core/PropertyTypes');

/**
 * @param {String} dst
 * @param {Item} item
 * @returns {Function}
 */
function writeObject(dst, item) {
  return function () {
    var obj = clone(item.base);
    delete obj._id;

    var fileLoaders = [];
    var fileProps;
    var fileObjs = {};
    item.getProperties().forEach(function (prop) {
      if (
        prop.getType() === PropertyTypes.FILE ||
        prop.getType() === PropertyTypes.IMAGE
      ) {
        let f = prop.getValue();
        if (f) {
          fileLoaders.push(f.getContents());
          fileProps.push(prop.getName());
          fileObjs[prop.getName()] = {
            name: f.name,
            options: f.options
          };
        }
      }
      if (prop.getType() === PropertyTypes.FILE_LIST) {
        let files =  prop.getValue();
        if (files) {
          fileProps.push(prop.getName());
          fileObjs[prop.getName()] = [];
          files.forEach(function (f) {
            fileLoaders.push(f.getContents());
            fileObjs[prop.getName()].push({
              name: f.name,
              options: f.options
            });
          });
        }
      }
    });

    return Promise.all(fileLoaders).then(function (files) {
      for (var i = 0; i < files.length; i++) {
        let pn = fileProps[i];
        if (Array.isArray(files[i])) {
          for (let j = 0; j < files[i].length; j++) {
            fileObjs[pn][j].body = files[i][j];
          }
        } else {
          fileObjs[pn].body = files[i];
        }
        obj[pn] = fileObjs[pn];
      }

      return new Promise(function (resolve, reject) {
        var fn = path.join(dst, encodeURIComponent(item.getClassName() + '@' + item.getItemId() + '.json'));
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
 * @param {ClassMeta} cm
 * @param {Number} [offset]
 * @returns {Promise}
 */
function exportData(dst, dataRepo, cm, offset) {
  return function () {
    var ofst = offset ? offset : 0;
    mkdirp.sync(dst);
    return dataRepo.getList(
        cm.getCanonicalName(),
        {
          offset: ofst,
          count: 100,
          nestingDepth: 0
        }
    ).then(
      function (list) {
        var w = null;
        for (var i = 0; i < list.length; i++) {
          if (w) {
            w = w.then(writeObject(dst, list[i]));
          } else {
            w = writeObject(dst, list[i])();
          }
        }
        if (!w) {
          w = Promise.resolve();
        }
        if (list.length === 100) {
          return w.then(exportData(dst, dataRepo, cm, ofst + 100));
        } else {
          return w;
        }
      }
    );
  };
}

function exportNode(dst, node, paths) {
  paths.push(node.code);
  var n = clone(node);
  delete n.children;
  delete n.namespace;
  delete n._id;
  var fn = path.join(dst, node.code + '.json');
  fs.writeFileSync(fn, JSON.stringify(n, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл узла навигации ' + fn);
  for (var i = 0; i < node.children.length; i++) {
    exportNode(dst, node.children[i], paths);
  }
}

function exportSection(dst, section, paths) {
  var sect = clone(section);
  delete sect.nodes;
  delete sect.namespace;
  delete sect._id;
  mkdirp.sync(dst);
  var fn = path.join(dst, section.name + '.section.json');
  fs.writeFileSync(fn, JSON.stringify(sect, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл секции навигации ' + fn);
  var dirName = path.join(dst, section.name);
  mkdirp.sync(dirName);
  for (var nm in section.nodes) {
    if (section.nodes.hasOwnProperty(nm)) {
      exportNode(dirName, section.nodes[nm], paths);
    }
  }
}

function exportViewModel(className, dst, vm) {
  var v = clone(vm);
  delete v.type;
  delete v.path;
  delete v.className;
  delete v.namespace;
  delete v._id;
  mkdirp.sync(path.join(
    dst,
    vm.path ? vm.path.replace('.', path.delimiter) : '',
    className));

  var fn = path.join(
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
  var vm = fetcher(cm.getCanonicalName(), null, cm.version);
  mkdirp.sync(dst);
  if (vm) {
    exportViewModel(cm.getName(), dst, vm);
  }

  for (var i = 0; i < paths.length; i++) {
    vm = fetcher(cm.getCanonicalName(), paths[i], cm.version);
    if (vm && vm.path) {
      exportViewModel(cm.getName(), dst, vm);
    }
  }
}

/**
 * @param {String} dst
 * @param {ClassMeta} cm
 * @param {String[]} paths
 */
function exportClass(dst, cm, paths, metaRepo) {
  var c = clone(cm.plain);
  delete c.namespace;
  delete c._id;
  mkdirp.sync(path.join(dst, 'meta'));
  var fn = path.join(dst, 'meta', cm.getName() + (cm.getVersion() ? '_' + cm.getVersion() : '') + '.class.json');
  fs.writeFileSync(fn, JSON.stringify(c, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл мета-класса ' + fn);

  var viewsDir = path.join(dst, 'views');
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getItemViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getCreationViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getListViewModel(className, path, version);
  });
}

/**
 * @param {String} dst
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @param {{}} options
 * @param {String} options.namespace
 * @param {String} options.version
 * @param {Boolean} options.skipData
 * @returns {Promise}
 */
module.exports = function (dst, metaRepo, dataRepo, options) {
  return new Promise(function (resolve, reject) {
    metaRepo.init().then(function () {
      var i, dataPromises, paths, dpc, nm;

      paths = [];
      dpc = [];
      try {
        // Экспорт навигации
        var sections = metaRepo.getNavigationSections(options.namespace);
        for (nm in sections) {
          if (sections.hasOwnProperty(nm)) {
            exportSection(path.join(dst, 'navigation'), sections[nm], paths);
          }
        }

        // Экспорт меты и моделей представления и формирование промисов экспорта данных
        var metas = metaRepo.listMeta(null, options.version, false, options.namespace);
        for (i = 0; i < metas.length; i++) {
          exportClass(dst, metas[i], paths, metaRepo);
          if (!options.skipData) {
            dpc.push(exportData(path.join(dst, 'data'), dataRepo, metas[i]));
          }
        }
      } catch (error) {
        return reject(error);
      }

      dataPromises = [];
      for (i = 0; i < dpc.length; i++) {
        dataPromises.push(dpc[i]());
      }

      return Promise.all(dataPromises);
    }).then(resolve).catch(reject);
  });
};
