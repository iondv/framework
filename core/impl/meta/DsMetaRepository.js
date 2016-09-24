// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
// jscs:disable requireCapitalizedComments
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */
'use strict';

var MetaRepositoryModule = require('core/interfaces/MetaRepository');
var MetaRepository = MetaRepositoryModule.MetaRepository;
var ClassMeta = MetaRepositoryModule.ClassMeta;
var PropertyTypes = require('core/PropertyTypes');
var clone = require('clone');

const defaultVersion = '___default';

/* jshint maxstatements: 60, maxcomplexity: 20 */

function viewPath(nodeCode,className) {
  return (nodeCode ? nodeCode + '/' : '') + className;
}

function formNS(ns) {
  return 'ns_' + (ns ? ns : '');
}

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

function findByVersion(arr, version, i1, i2) {
  if (!i1) { i1 = 0; }
  if (!i2) { i2 = arr.length - 1; }

  if (arr[i1].version === version) {
    return arr[i1];
  }

  if (arr[i2].version === version) {
    return arr[i2];
  }

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
}

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {String} [options.MetaTableName]
 * @param {String} [options.ViewTableName]
 * @param {String} [options.NavTableName]
 * @param {DbSync} [options.sync]
 * @constructor
 */
function DsMetaRepository(options) {

  var _this = this;

  /**
   * @type {String}
   */
  this.metaTableName = options.MetaTableName || 'ion_meta';

  /**
   * @type {String}
   */
  this.viewTableName = options.ViewTableName || 'ion_view';

  /**
   * @type {String}
   */
  this.navTableName = options.NavTableName || 'ion_nav';

  /**
   * @type {DataSource}
   */
  this.ds = null;

  /**
   * @type {DbSync}
   */
  this.sync = options.sync;

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

  this.ds = options.dataSource;

  if (!this.ds) {
    throw 'Не указан источник данных мета репозитория!';
  }

  /**
   * @param {String} name
   * @param {String} [version]
   * @param {String} [namespace]
   * @returns {ClassMeta}
   */
  function getFromMeta(name, version, namespace) {
    try {
      var parts = name.split('@');
      if (parts.length > 1) {
        name = parts[0];
        namespace = parts[1];
      }
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
    } catch (err) {
    }
    throw new Error('Класс ' + name + '(' + version + ') не найден в пространстве имен ' + namespace + '!');
  }

  this._getMeta = function (name, version, namespace) {
    return getFromMeta(name, version, namespace);
  };

  this._listMeta = function (ancestor, version, direct, namespace) {
    var cm, result, ns;
    result = [];
    if (ancestor) {
      cm = getFromMeta(ancestor, version, namespace);
      if (direct) {
        return cm.getDescendants();
      } else {
        (function fillDescendants(src) {
          result = result.concat(src);
          for (var i = 0; i < src.length; i++) {
            fillDescendants(src[i].getDescendants());
          }
        })(cm.getDescendants());
        return result;
      }
    } else {
      ns = formNS(namespace);
      for (var nm  in this.classMeta) {
        if (this.classMeta.hasOwnProperty(nm) && ns === nm) {
          for (var cn in this.classMeta[nm]) {
            if (this.classMeta[nm].hasOwnProperty(cn)) {
              if (version) {
                if (_this.classMeta[nm][cn].hasOwnProperty(version)) {
                  result.push(_this.classMeta[nm][cn].byVersion[version]);
                  continue;
                }
                cm = findByVersion(_this.classMeta[nm][cn].byOrder, version);
                if (cm) {
                  result.push(cm);
                }
              } else {
                Array.prototype.push.apply(result, _this.classMeta[nm][cn].byOrder);
              }
            }
          }
        }
      }
      return result;
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
    result.sort(function (a, b) {
      return a.orderNumber - b.orderNumber;
    });
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

  /**
   * @param {String} node
   * @param {ClassMeta} meta
   * @param {{}} coll
   * @returns {*}
     */
  function getViewModel(node, meta, coll) {
    var path = viewPath(node, meta.getName());
    var ns = formNS(meta.getNamespace());

    if (coll.hasOwnProperty(ns)) {
      if (coll[ns].hasOwnProperty(path)) {
        return findByVersion(coll[ns][path], meta.getVersion()); // TODO locate model in parent nodes
      } else if (coll[ns].hasOwnProperty(meta.getName())) {
        return findByVersion(coll[ns][meta.getName()], meta.getVersion()); // TODO locate model in parent nodes
      } else if (meta.getAncestor()) {
        return getViewModel(node, meta.getAncestor(), coll);
      }
    }
    return null;
  }

  this._getListViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.listModels);
    if (!vm && meta.getAncestor()) {
      return this._getListViewModel(meta.getAncestor().getName(), node, namespace);
    }
    return vm;
  };

  this._getCollectionViewModel = function (classname, collection, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    return getViewModel(node, meta, this.viewMeta.collectionModels);
  };

  this._getItemViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.itemModels);
    if (!vm && meta.getAncestor()) {
      return this._getItemViewModel(meta.getAncestor().getName(), node, namespace);
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

  this._getCreationViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
    return getCVM(node, meta);
  };

  this._getDetailViewModel = function (classname, node, namespace) {
    var meta = this._getMeta(classname, namespace);
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

  /**
   * @param {ClassMeta} cm
   */
  function expandStructs(cm) {
    var pm, i, j;
    for (i = 0; i < cm.plain.properties.length; i++) {
      if (cm.plain.properties[i].type === PropertyTypes.STRUCT) {
        var structClass;
        try {
          structClass = getFromMeta(cm.plain.properties[i].refClass, cm.plain.version, cm.getNamespace());
        } catch (err) {
          throw new Error('Не найден класс [' + cm.plain.properties[i].refClass +
            '] для структуры [' + cm.plain.caption + '].[' + cm.plain.properties[i].caption + ']');
        }
        if (!structClass.___structs_expanded) {
          expandStructs(structClass);
        }
        var spms = structClass.getPropertyMetas();
        for (j = 0; j < spms.length; j++) {
          pm = clone(spms[j]);
          pm.name = cm.plain.properties[i].name + '$' + pm.name;
          cm.propertyMetas[pm.name] = pm;
        }
      }
    }
    cm.___structs_expanded = true;
  }

  function countDepth(semantic, cm, depth) {
    var i,expr, tmpExpr, pm;
    var parts = semantic.split('|');
    for (i = 0; i < parts.length; i++) {
      if (parts[i].trim()) {
        expr = parts[i].trim().match(/([^\[\s]*)(\s*\[\s*(\d+)\s*,\s*(\d+)\s*\])?/g);
        if (expr) {
          tmpExpr = expr[0].split('.');
          if (tmpExpr.length) {
            pm = cm.getPropertyMeta(tmpExpr[0]);
            if (pm && pm.type === PropertyTypes.REFERENCE) {
              if ((tmpExpr.length - 1) > depth) {
                return (tmpExpr.length - 1);
              }
            }
          }
        }
      }
    }
    return depth;
  }

  /**
   * @param {ClassMeta} cm
   */
  function produceSemantics(cm){
    var curDepth, i, propertyMetas;
    curDepth = cm._semanticDepth;
    propertyMetas = cm.getPropertyMetas();
    if (cm) {
      if (cm.plain.semantic && cm.plain.semantic.trim()) {
        curDepth = countDepth(cm.plain.semantic, cm, curDepth);

        var semanticBody = [];
        var semanticFunctionCreator = function(propertyName) {
          return function(item) {
            var p = item.property(propertyName);
            if(p) {
              return p.getDisplayValue();
            }
            return propertyName;
          }
        };

        var semanticGetter = function(body){
          return function(item){
            var result = "";
            for (var i = 0; i <= body.length; i++) {
              if (typeof body[i] === 'function') {
                result = result + body[i].call(this,item);
              } else {
                result = result + body[i];
              }
            }
            return result;
          }
        };

        var parts = cm.plain.semantic.split("|");
        for (i=0; i < parts.length; i++) {
          var pm = cm.getPropertyMeta(parts[i].trim());
          if(pm) {
            semanticBody.push(semanticFunctionCreator(pm.name));
          } else {
            semanticBody.push(parts[i]);
          }
        }
        cm._semanticFunc = semanticGetter(semanticBody);
      }
      for (i = 0; i < propertyMetas.length; i++) {
        if (propertyMetas[i].semantic && propertyMetas[i].semantic.trim()) {
          curDepth = countDepth(propertyMetas[i].semantic, cm, curDepth);
        }
      }
    }
    cm._semanticDepth = curDepth;
  }

  function acceptClassMeta(metas) {
    var i, name, ns, cm;
    _this.classMeta = {};
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
      cm = new ClassMeta(metas[i]);
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

        for (name in _this.classMeta[ns]) {
          if (_this.classMeta[ns].hasOwnProperty(name)) {
            for (i = 0; i < _this.classMeta[ns][name].byOrder.length; i++) {
              cm = _this.classMeta[ns][name].byOrder[i];
              expandStructs(cm);
              produceSemantics(cm);
            }
          }
        }
      }
    }
  }

  function sortViewElements(src) {
    var i;
    if (typeof src.columns !== 'undefined' && src.columns.length) {
      src.columns.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (i = 0; i < src.columns.length; i++) {
        sortViewElements(src.columns[i]);
      }
    }

    if (typeof src.tabs !== 'undefined' && src.tabs.length) {
      for (i = 0; i < src.tabs.length; i++) {
        sortViewElements(src.tabs[i]);
      }
    }

    if (typeof src.fullFields !== 'undefined' && src.fullFields.length) {
      src.fullFields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (i = 0; i < src.fullFields.length; i++) {
        sortViewElements(src.fullFields[i]);
      }
    }

    if (typeof src.shortFields !== 'undefined' && src.shortFields.length) {
      src.shortFields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (i = 0; i < src.shortFields.length; i++) {
        sortViewElements(src.shortFields[i]);
      }
    }

    if (typeof src.fields !== 'undefined' && src.fields.length) {
      src.fields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (i = 0; i < src.fields.length; i++) {
        sortViewElements(src.fields[i]);
      }
    }
    return src;
  }

  function acceptViews(views) {
    _this.viewMeta = {
      listModels: {},
      collectionModels: {},
      itemModels: {},
      createModels: {},
      detailModels: {},
      masks: {},
      validators: {}
    };

    for (var i = 0; i < views.length; i++) {
      switch (views[i].type){
        case 'list': assignVm(_this.viewMeta.listModels, sortViewElements(views[i])); break;
        case 'collection': assignVm(_this.viewMeta.collectionModels, sortViewElements(views[i])); break;
        case 'item': assignVm(_this.viewMeta.itemModels, sortViewElements(views[i])); break;
        case 'create': assignVm(_this.viewMeta.createModels, sortViewElements(views[i])); break;
        case 'detail': assignVm(_this.viewMeta.detailModels, sortViewElements(views[i])); break;
        case 'masks': _this.viewMeta.masks[views[i].name] = views[i]; break;
        case 'validators': _this.viewMeta.validators[views[i].name] = views[i]; break;
        default: break;
      }
    }
  }

  function acceptNavigation(navs) {
    var i, ns, name;
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
              n.code.indexOf('.') === -1) {
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

        for (name in _this.navMeta.nodes[ns]) {
          if (_this.navMeta.nodes[ns].hasOwnProperty(name)) {
            _this.navMeta.nodes[ns][name].children.sort(function (a, b) {
              return a.orderNumber - b.orderNumber;
            });
          }
        }
      }
    }
  }

  function init() {
    return new Promise(function (resolve, reject) {
      Promise.all(
        [
          _this.ds.fetch(_this.metaTableName, {sort: {name: 1, version: 1}}),
          _this.ds.fetch(_this.viewTableName, {type: 1, className: 1, path: 1, version: 1}),
          _this.ds.fetch(_this.navTableName, {sort: {itemType: -1, name: 1}})
        ]
      ).then(
        function (results) {
          acceptClassMeta(results[0]);
          acceptViews(results[1]);
          acceptNavigation(results[2]);
          resolve();
        }
      ).catch(reject);
    });
  }

  /**
   * @returns {Promise}
   * @private
     */
  this._init = function () {
    if (this.sync) {
      return new Promise(function (resolve, reject) {
        _this.sync.init().then(init).then(resolve).catch(reject);
      });
    }
    return init();
  };
}

DsMetaRepository.prototype = new MetaRepository();
module.exports = DsMetaRepository;
