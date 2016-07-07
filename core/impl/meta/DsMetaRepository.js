/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */
'use strict';

var MetaRepositoryModule = require('core/interfaces/MetaRepository');
var MetaRepository = MetaRepositoryModule.MetaRepository;
var ClassMeta = MetaRepositoryModule.ClassMeta;

var Datasources = require('core/datasources');

function DsMetaRepository(config) {

  var _this = this;

  /**
   * @type {Sring}
   */
  this.metaTableName = 'ion_meta';

  /**
   * @type {Sring}
   */
  this.viewTableName = 'ion_view';

  /**
   * @type {Sring}
   */
  this.navTableName = 'ion_nav';

  /**
   * @type {DataSource}
   */
  this.ds = null;

  this.classMeta = {};

  this.viewMeta = {
    listModels: {},
    collectionModels: {},
    itemModels: {},
    createModels: {},
    detailModels: {},
    masks: {},
    validators: {}
  };

  this.navMeta = {
    sections: {},
    nodes: {},
    classnames: {}
  };

  this.isClassMetaLoaded = false;
  this.classMetaBusy = false;

  this.isViewMetaLoaded = false;
  this.viewMetaBusy = false;

  this.isNavMetaLoaded = false;
  this.navMetaBusy = false;

  if (config.metaTables && config.metaTables.MetaTableName) {
    this.metaTableName = config.metaTables.MetaTableName;
  }
  if (config.metaTables && config.metaTables.ViewTableName) {
    this.viewTableName = config.metaTables.ViewTableName;
  }
  if (config.metaTables && config.metaTables.NavTableName) {
    this.navTableName = config.metaTables.NavTableName;
  }

  if (config.Datasource) {
    this.ds = config.Datasource;
  }

  if (!this.ds && config.metaDs) {
    if (global.ionDataSources) {
      this.ds = global.ionDataSources.get(config.metaDs);
    }
    if (!this.ds) {
      var dataSources = new Datasources(config);
      this.ds = dataSources.get(config.metaDs);
    }
  }

  if (!this.ds) {
    throw 'Не удалось определить источник данных!';
  }

  var defaultVersion = '___default';

  function findByVersion(arr, version, i1, i2) {
    if (!i1) { i1 = 0; }
    if (!i2) { i2 = arr.length - 1; }

    if (arr[i1].version === version) {
      return arr[i1];
    }

    if (arr[i2].version === version) {
      return arr[i2];
    }

    // If ((arr[i1].version < version) && (arr[i2].version > version)) {// jscs:ignore requireSpaceAfterLineComment
    if (i1 < i2 - 1) {
      var middle = Math.floor((i1 + i2) / 2);
      if (arr[middle].version < version) {
        return findByVersion(arr, version, middle, i2);
      } else {
        return findByVersion(arr, version, i1, middle);
      }
    } else {
      return arr[i1];
    }
    // }
    return null;
  }

  function getFromMeta(name, version) {
    if (_this.classMeta.hasOwnProperty(name)) {
      if (version) {
        if (_this.classMeta[name].hasOwnProperty(version)) {
          return _this.classMeta[name].byVersion[version];
        } else {
          var cm = findByVersion(_this.classMeta[name].byOrder, version);
          if (cm) {
            return cm;
          }
        }
      }
      return _this.classMeta[name][defaultVersion];
    }
    throw new Error('Класс ' + name + '(' + version + ') не найден!');
  }

  this._getMeta = function (name,version) {
    return getFromMeta(name, version);
  };

  this._listMeta = function (ancestor,version,direct) {
    if (ancestor) {
      var cm = getFromMeta(ancestor, version);
      if (direct) {
        return cm.getDescendants();
      } else {
        var result = [];
        (function fillDescendants(src) {
          result = result.concat(src);
          for (var i = 0; i < src.length; i++) {
            fillDescendants(src[i].getDescendants());
          }
        })(cm.getDescendants());
        return result;
      }
    }
  };

  this._ancestor = function (classname,version) {
    var cm = getFromMeta(classname, version);
    return cm.getAncestor();
  };

  this._propertyMetas = function (classname,version) {
    var cm = getFromMeta(classname, version);
    return cm.getPropertyMetas();
  };

  this._getNavigationSections = function () {
    return _this.navMeta.sections;
  };

  this._getNavigationSection = function (code) {
    if (this.navMeta.sections.hasOwnProperty(code)) {
      return this.navMeta.sections[code];
    }
    return null;
  };

  this._getNodes = function (section, parent) {
    var result = [];
    var src = this.navMeta.roots;
    if (section && this.navMeta.sections.hasOwnProperty(section)) {
      src = this.navMeta.sections[section].nodes;
    }

    if (parent) {
      if (src.hasOwnProperty(parent)) {
        return src[parent].children;
      } else {
        return [];
      }
    }

    for (var code in src) {
      if (src.hasOwnProperty(code)) {
        result.push(src[code]);
      }
    }
    return result;
  };

  this._getNode = function (code) {
    if (this.navMeta.nodes.hasOwnProperty(code)) {
      return this.navMeta.nodes[code];
    }
    return null;
  };

  this._getNodeForClassname = function (className) {
    if (this.navMeta.classnames.hasOwnProperty(className)) {
      return this.navMeta.classnames[className];
    }
  };

  function getViewModel(node, meta, coll) {
    var path = viewPath(node, meta.getName());
    if (coll.hasOwnProperty(path)) {
      return findByVersion(coll[path], meta.getVersion()); // TODO locate model in parent nodes
    } else if (coll.hasOwnProperty(meta.getName())) {
      return findByVersion(coll[meta.getName()], meta.getVersion()); // TODO locate model in parent nodes
    } else if (meta.getAncestor()) {
      return getViewModel(node, meta.getAncestor(), coll);
    }
    return null;
  }

  this._getListViewModel = function (classname, node) {
    var meta = this._getMeta(classname);
    var vm = getViewModel(node, meta, this.viewMeta.listModels);
    if (!vm && meta.getAncestor()) {
      return this._getListViewModel(meta.getAncestor().getName(), node);
    }
    return vm;
  };

  this._getCollectionViewModel = function (classname, collection, node) {
    var meta = this._getMeta(classname);
    return getViewModel(node, meta, this.viewMeta.collectionModels);
  };

  this._getItemViewModel = function (classname, node) {
    var meta = this._getMeta(classname);
    var vm = getViewModel(node, meta, this.viewMeta.itemModels);
    if (!vm && meta.getAncestor()) {
      return this._getItemViewModel(meta.getAncestor().getName(), node);
    }
    return vm;
  };

  function getCVM(node, meta) {
    var vm = getViewModel(node, meta, _this.viewMeta.createModels);
    if (!vm) {
      vm = getViewModel(node, meta, _this.viewMeta.itemModels);
    }
    if (!vm && meta.getAncestor()) {
      return getCVM(node, meta.getAncestor());
    }
    return vm;
  }

  this._getCreationViewModel = function (classname, node) {
    var meta = this._getMeta(classname);
    return getCVM(node, meta);
  };

  this._getDetailViewModel = function (classname, node) {
    var meta = this._getMeta(classname);
    return getViewModel(node, meta, this.viewMeta.detailModels);
  };

  this._getMask = function (name) {
    if (this.viewMeta.masks.hasOwnProperty(name)) {
      return this.viewMeta.masks[name];
    }
    return null;
  };

  this._getValidators = function () {
    return this.viewMeta.validators;
  };

  function viewPath(nodeCode,className) {
    return (nodeCode ? (nodeCode + '/') : '') + className;
  }

  this._init = function () {
    return new Promise(function (resolve, reject) {
      Promise.all(
        [
          _this.ds.fetch(_this.metaTableName, {sort: {name: 1, version: 1}}),
          _this.ds.fetch(_this.viewTableName, {}),
          _this.ds.fetch(_this.navTableName, {sort: {name: 1}})
        ]
      ).then(
        function (results) {
          var i, name, cm;

          var metas = results[0];
          var views = results[1];
          var navs = results[2];

          /*
          Function sortVer(coll) {
            for (var path in coll) {
              if (coll.hasOwnProperty(path)) {
                coll[path].sort(function(a,b){
                  if (a.version > b.version) {
                    return 1;
                  } else if (a.version < b.version) {
                    return -1;
                  }
                  return 0;
                });
              }
            }
          }
          */
          _this.classMeta = {};
          for (i = 0; i < metas.length; i++) {
            if (!_this.classMeta.hasOwnProperty(metas[i].name)) {
              _this.classMeta[metas[i].name] = {
                byVersion: {},
                byOrder: []
              };
            }
            cm = new ClassMeta(metas[i],_this);
            cm.version = metas[i].version;
            _this.classMeta[metas[i].name].byVersion[metas[i].version] = cm;
            _this.classMeta[metas[i].name].byOrder.push(cm);
            _this.classMeta[metas[i].name][defaultVersion] = cm;
          }

          for (name in _this.classMeta) {
            if (_this.classMeta.hasOwnProperty(name)) {
              for (i = 0; i < _this.classMeta[name].byOrder.length; i++) {
                cm = _this.classMeta[name].byOrder[i];
                if (cm.plain.ancestor) {
                  cm.ancestor = _this._getMeta(cm.plain.ancestor, cm.plain.version);
                  if (cm.ancestor) {
                    cm.ancestor.descendants.push(cm);
                  }
                }
              }
            }
          }

          _this.viewMeta = {
            listModels: {},
            collectionModels: {},
            itemModels: {},
            createModels: {},
            detailModels: {},
            masks: {},
            validators: {}
          };

          function assignVm(coll, vm) {
            if (!coll.hasOwnProperty(viewPath(vm.path, vm.className))) {
              coll[viewPath(vm.path, vm.className)] = [];
            }
            var arr = coll[viewPath(vm.path, vm.className)];
            arr.push(vm);
          }

          for (i = 0; i < views.length; i++) {
            switch (views[i].type){
              case 'list': assignVm(_this.viewMeta.listModels, views[i]); break;
              case 'collection': assignVm(_this.viewMeta.collectionModels, views[i]); break;
              case 'item': assignVm(_this.viewMeta.itemModels, views[i]); break;
              case 'create': assignVm(_this.viewMeta.createModels, views[i]); break;
              case 'detail': assignVm(_this.viewMeta.detailModels, views[i]); break;
              case 'masks': _this.viewMeta.masks[views[i].name] = views[i]; break;
              case 'validators': _this.viewMeta.validators[views[i].name] = views[i]; break;
              default: break;
            }
          }
          /*
          SortVer(_this.viewMeta.listModels);
          sortVer(_this.viewMeta.collectionModels);
          sortVer(_this.viewMeta.itemModels);
          sortVer(_this.viewMeta.createModels);
          sortVer(_this.viewMeta.detailModels);
*/
          _this.navMeta = {
            sections: {},
            nodes: {},
            classnames: {},
            roots: {}
          };

          for (i = 0; i < navs.length; i++) {
            if (navs[i].itemType === 'section') {
              _this.navMeta.sections[navs[i].name] = navs[i];
              _this.navMeta.sections[navs[i].name].nodes = {};
            } else if (navs[i].itemType === 'node') {
              _this.navMeta.nodes[navs[i].code] = navs[i];
              _this.navMeta.nodes[navs[i].code].children = [];
              if (navs[i].code.indexOf('.') === -1) {
                _this.navMeta.roots[navs[i].code] = _this.navMeta.nodes[navs[i].code];
              }
              if (navs[i].type === 1) {
                _this.navMeta.classnames[navs[i].classname] = navs[i].code;
              }
            }
          }

          for (name in _this.navMeta.nodes) {
            if (_this.navMeta.nodes.hasOwnProperty(name)) {
              var n = _this.navMeta.nodes[name];
              if (_this.navMeta.sections.hasOwnProperty(n.section) && (n.code.indexOf('.') === -1)) {
                _this.navMeta.sections[n.section].nodes[n.code] = n;
              }

              if (n.code.indexOf('.') !== -1) {
                var p = n.code.substring(0, n.code.lastIndexOf('.'));
                if (_this.navMeta.nodes.hasOwnProperty(p)) {
                  _this.navMeta.nodes[p].children.push(n);
                }
              }
            }
          }
          resolve();
        }
      ).catch(reject);
    });
  };
}

DsMetaRepository.prototype = new MetaRepository();
module.exports = DsMetaRepository;
