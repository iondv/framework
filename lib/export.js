/**
 * Created by kras on 12.07.16.
 */
var fs = require('fs');
var path = require('path');
var clone = require('clone');

/**
 * @param {String} dst
 * @param {DataRepository} dataRepo
 * @param {ClassMeta} cm
 * @param {Number} [offset]
 * @returns {Promise}
 */
function exportData(dst, dataRepo, cm, offset) {
  return new Promise(function (resolve, reject) {
      var ofst = offset ? offset : 0;
      dataRepo.getList(cm.getName() + '@' + cm.getNamespace(),
        {
          offset: ofst,
          count: 100,
          nestingDepth: 0
        }).
      then(function (list) {
        var fn;
        for (var i = 0; i < list.length; i++) {
          fn = list[i].getClassName() + '@' + list[i].getItemId() + '.json';
          fs.writeFileSync(path.join(dst, fn), JSON.stringify(list[i].base), {encoding: 'utf-8'});
          console.log('Записан файл данных ' + fn);
        }
        if (list.length === 100) {
          exportData(dst, dataRepo, cm, ofst + 100).
          then(resolve).
          catch(reject);
        } else {
          resolve();
        }
      }).
      catch(reject);
    });
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
  var fn = path.join(dst, section.name + 'section.json');
  fs.writeFileSync(fn, sect, {encoding: 'utf-8'});
  console.log('Записан файл секции навигации ' + fn);
  var dirName = path.join(dst, section.name);
  fs.mkdirSync(dirName);
  for (var nm in section.nodes) {
    if (section.nodes.hasOwnProperty(nm)) {
      exportNode(dirName, section.nodes[nm], paths);
    }
  }
}

function exportViewModel(className, dst, vm) {
  var v = clone(vm);
  delete v.itemType;
  delete v.path;
  delete v.namespace;
  var fn = path.join(
    dst,
    v.path.replace('.', path.delimiter),
    className,
    'item' + (vm.version ? '_' + vm.version : '') + '.json'
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
  if (vm) {
    exportViewModel(cm.getName(), dst, vm);
  }

  for (var i = 0; i < paths.length; i++) {
    vm = fetcher(cm.getCanonicalName(), paths[i], cm.version);
    if (vm) {
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
  var i, dataPromises, paths;

  paths = [];
  dataPromises = [];

  // Экспорт навигации
  var sections = metaRepo.getNavigationSections(options.namespace);
  for (i = 0; i < sections.length; i++) {
    exportSection(path.join(dst, 'navigation'), sections[i], paths);
  }

  // Экспорт меты и моделей представления и формирование промисов экспорта данных
  var metas = metaRepo.listMeta(null, options.version, false, options.namespace);
  for (i = 0; i < metas.length; i++) {
    exportClass(dst, metas[i], paths, metaRepo);
    dataPromises.push(exportData(path.join(dst, 'data'), dataRepo, metas[i]));
  }

  return Promise.all(dataPromises);
};
