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

  function formNS(ns) {
    return 'ns_' + (ns ? ns : '');
  }

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

  function getFromMeta(name, version, namespace) {
    var ns = formNS(namespace);
    if (_this.classMeta[ns].hasOwnProperty(name)) {
      if (version) {
        if (_this.classMeta[ns][name].hasOwnProperty(version)) {
          return _this.classMeta[ns][name].byVersion[version];
        } else {
          var cm = findByVersion(_this.classMeta[ns][name].byOrder, version);
          if (cm) {
            return cm;
          }
        }
      }
      return _this.classMeta[ns][name][defaultVersion];
    }
    throw new Error('Класс ' + name + '(' + version + ') не найден в пространстве имен ' + namespace + '!');
  }

  this._getMeta = function (name,version, namespace) {
    return getFromMeta(name, version, namespace);
  };

  this._listMeta = function (ancestor, version, direct, namespace) {
    if (ancestor) {
      var cm = getFromMeta(ancestor, version, namespace);
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

  this._ancestor = function (classname,version, namespace) {
    var cm = getFromMeta(classname, version, namespace);
    return cm.getAncestor();
  };

  this._propertyMetas = function (classname,version, namespace) {
    var cm = getFromMeta(classname, version, namespace);
    return cm.getPropertyMetas();
  };

  this._getNavigationSections = function (namespace) {
    var ns = formNS(namespace);
    if (_this.navMeta.sections.hasOwnProperty(ns)) {
      return _this.navMeta.sections[ns];
    }
    return [];
  };

  this._getNavigationSection = function (code, namespace) {
    var ns = formNS(namespace);
    if (this.navMeta.sections.hasOwnProperty(ns) && this.navMeta.sections[ns].hasOwnProperty(code)) {
      return this.navMeta.sections[ns][code];
    }
    return null;
  };

  this._getNodes = function (section, parent, namespace) {
    var ns = formNS(namespace);
    var result = [];
    var src = {};

    if (this.navMeta.roots.hasOwnProperty(ns)) {
      src = this.navMeta.roots[ns];
    }

    if (section && this.navMeta.sections.hasOwnProperty(ns) && this.navMeta.sections[ns].hasOwnProperty(section)) {
      src = this.navMeta.sections[ns][section].nodes;
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

  this._getNode = function (code, namespace) {
    var ns = formNS(namespace);
    if (this.navMeta.nodes.hasOwnProperty(ns) && this.navMeta.nodes[ns].hasOwnProperty(code)) {
      return this.navMeta.nodes[ns][code];
    }
    return null;
  };

  this._getNodeForClassname = function (className, namespace) {
    var ns = formNS(namespace);
    if (this.navMeta.classnames.hasOwnProperty(ns) && this.navMeta.classnames[ns].hasOwnProperty(className)) {
      return this.navMeta.classnames[ns][className];
    }
    return null;
  };

  function getViewModel(node, meta, coll, namespace) {
    var path = viewPath(node, meta.getName());
    var ns = formNS(namespace);

    if (coll.hasOwnProperty(ns)) {
      if (coll[ns].hasOwnProperty(path)) {
        return findByVersion(coll[ns][path], meta.getVersion()); // TODO locate model in parent nodes
      } else if (coll[ns].hasOwnProperty(meta.getName())) {
        return findByVersion(coll[ns][meta.getName()], meta.getVersion()); // TODO locate model in parent nodes
      } else if (meta.getAncestor()) {
        return getViewModel(node, meta.getAncestor(), coll, namespace);
      }
    }
    return null;
  }

  this._getListViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.listModels, namespace);
    if (!vm && meta.getAncestor()) {
      return this._getListViewModel(meta.getAncestor().getName(), node, namespace);
    }
    return vm;
  };

  this._getCollectionViewModel = function (classname, collection, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    return getViewModel(node, meta, this.viewMeta.collectionModels, namespace);
  };

  this._getItemViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.itemModels, namespace);
    if (!vm && meta.getAncestor()) {
      return this._getItemViewModel(meta.getAncestor().getName(), node, namespace);
    }
    return vm;
  };

  function getCVM(node, meta, namespace) {
    var vm = getViewModel(node, meta, _this.viewMeta.createModels, namespace);
    if (!vm) {
      vm = getViewModel(node, meta, _this.viewMeta.itemModels, namespace);
    }
    if (!vm && meta.getAncestor()) {
      return getCVM(node, meta.getAncestor(), namespace);
    }
    return vm;
  }

  this._getCreationViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    return getCVM(node, meta, namespace);
  };

  this._getDetailViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    return getViewModel(node, meta, this.viewMeta.detailModels, namespace);
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
          var ns;
          for (i = 0; i < metas.length; i++) {
            ns = formNS(metas[i].namespace);
            if (!_this.classMeta.hasOwnProperty(ns)) {
              _this.classMeta[ns] = {};
            }

            if (!_this.classMeta[ns].hasOwnProperty(metas[i].name)) {
              _this.classMeta[ns][metas[i].name] = {
                byVersion: {},
                byOrder: []
              };
            }
            cm = new ClassMeta(metas[i],_this);
            cm.namespace = metas[i].namespace;
            _this.classMeta[ns][metas[i].name].byVersion[metas[i].version] = cm;
            _this.classMeta[ns][metas[i].name].byOrder.push(cm);
            _this.classMeta[ns][metas[i].name][defaultVersion] = cm;
          }

          for (ns in _this.classMeta) {
            if (_this.classMeta.hasOwnProperty(ns)) {
              for (name in _this.classMeta[ns]) {
                if (_this.classMeta[ns].hasOwnProperty(name)) {
                  for (i = 0; i < _this.classMeta[ns][name].byOrder.length; i++) {
                    cm = _this.classMeta[ns][name].byOrder[i];
                    if (cm.plain.ancestor) {
                      cm.ancestor = _this._getMeta(cm.plain.ancestor, cm.plain.version, cm.namespace);
                      if (cm.ancestor) {
                        cm.ancestor.descendants.push(cm);
                      }
                    }
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
            var ns = formNS(vm.namespace);
            if (!coll.hasOwnProperty(ns)) {
              coll[ns] = {};
            }
            if (!coll[ns].hasOwnProperty(viewPath(vm.path, vm.className))) {
              coll[ns][viewPath(vm.path, vm.className)] = [];
            }
            var arr = coll[ns][viewPath(vm.path, vm.className)];
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
            ns = formNS(navs[i].namespace);
            if (navs[i].itemType === 'section') {
              if (!_this.navMeta.sections.hasOwnProperty(ns)) {
                _this.navMeta.sections[ns] = {};
              }
              _this.navMeta.sections[ns][navs[i].name] = navs[i];
              _this.navMeta.sections[ns][navs[i].name].nodes = {};
            } else if (navs[i].itemType === 'node') {
              if (!_this.navMeta.nodes.hasOwnProperty(ns)) {
                _this.navMeta.nodes[ns] = {};
              }
              _this.navMeta.nodes[ns][navs[i].code] = navs[i];
              _this.navMeta.nodes[ns][navs[i].code].children = [];
              if (navs[i].code.indexOf('.') === -1) {
                if (!_this.navMeta.roots.hasOwnProperty(ns)) {
                  _this.navMeta.roots[ns] = {};
                }
                _this.navMeta.roots[ns][navs[i].code] = _this.navMeta.nodes[ns][navs[i].code];
              }
              if (navs[i].type === 1) {
                if (!_this.navMeta.classnames.hasOwnProperty(ns)) {
                  _this.navMeta.classnames[ns] = {};
                }
                _this.navMeta.classnames[ns][navs[i].classname] = navs[i].code;
              }
            }
          }

          for (ns in _this.navMeta.nodes) {
            if (_this.navMeta.nodes.hasOwnProperty(ns)) {
              for (name in _this.navMeta.nodes[ns]) {
                if (_this.navMeta.nodes[ns].hasOwnProperty(name)) {
                  var n = _this.navMeta.nodes[ns][name];
                  if (_this.navMeta.sections.hasOwnProperty(ns) &&
                    _this.navMeta.sections[ns].hasOwnProperty(n.section) &&
                    (n.code.indexOf('.') === -1)) {
                    _this.navMeta.sections[ns][n.section].nodes[n.code] = n;
                  }

                  if (n.code.indexOf('.') !== -1) {
                    var p = n.code.substring(0, n.code.lastIndexOf('.'));
                    if (_this.navMeta.nodes[ns].hasOwnProperty(p)) {
                      _this.navMeta.nodes[ns][p].children.push(n);
                    }
                  }
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
