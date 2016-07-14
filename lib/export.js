/**
 * Created by kras on 12.07.16.
 */
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var mkdirp = require('mkdirp');

/**
 * @param {String} dst
 * @param {DataRepository} dataRepo
 * @param {ClassMeta} cm
 * @param {Number} [offset]
 * @returns {Promise}
 */
function exportData(dst, dataRepo, cm, offset) {
  return function () {
    return new Promise(function (resolve, reject) {
      var ofst = offset ? offset : 0;
      mkdirp.sync(dst);
      dataRepo.getList(cm.getName() + '@' + cm.getNamespace(),
        {
          offset: ofst,
          count: 100,
          nestingDepth: 0
        }).then(function (list) {
        var fn;
        for (var i = 0; i < list.length; i++) {
          fn = path.join(dst, list[i].getClassName() + '@' + list[i].getItemId() + '.json');
          fs.writeFileSync(fn, JSON.stringify(list[i].base), {encoding: 'utf-8'});
          console.log('Записан файл данных ' + fn);
        }
        if (list.length === 100) {
          exportData(dst, dataRepo, cm, ofst + 100).then(resolve).catch(reject);
        } else {
          resolve();
        }
      }).catch(reject);
    });
  };
}

function exportNode(dst, node, paths) {
  paths.push(node.code);
  var n = clone(node);
  delete n.children;
  delete n.namespace;
  var fn = path.join(dst, node.code + '.json');
  fs.writeFileSync(fn, JSON.stringify(n), {encoding: 'utf-8'});
  console.log('Записан файл узла навигации ' + fn);
  for (var i = 0; i < node.children.length; i++) {
    exportNode(dst, node.children[i]);
  }
}

function exportSection(dst, section, paths) {
  var sect = clone(section);
  delete sect.nodes;
  delete sect.namespace;
  mkdirp.sync(dst);
  var fn = path.join(dst, section.name + '.section.json');
  fs.writeFileSync(fn, sect, {encoding: 'utf-8'});
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
    JSON.stringify(v),
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
  mkdirp.sync(path.join(dst, 'meta'));
  var fn = path.join(dst, 'meta', cm.getName() + (cm.getVersion() ? '_' + cm.getVersion() : '') + '.class.json');
  fs.writeFileSync(fn, JSON.stringify(c), {encoding: 'utf-8'});
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
          dpc.push(exportData(path.join(dst, 'data'), dataRepo, metas[i]));
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
