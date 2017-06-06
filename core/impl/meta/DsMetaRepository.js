// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
// jscs:disable requireCapitalizedComments
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */
'use strict';

const MetaRepositoryModule = require('core/interfaces/MetaRepository');
const MetaRepository = MetaRepositoryModule.MetaRepository;
const ClassMeta = MetaRepositoryModule.ClassMeta;
const PropertyTypes = require('core/PropertyTypes');
const Calculator = require('core/interfaces/Calculator');
const clone = require('clone');

const defaultVersion = '___default';

/* jshint maxstatements: 60, maxcomplexity: 25, maxdepth: 20 */

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

  var arr1 = arr[i1].plain || arr[i1];
  var arr2 = arr[i2].plain || arr[i2];

  if (arr1.version === version) {
    return arr[i1];
  }

  if (arr2.version === version) {
    return arr[i2];
  }

  if (i1 < i2 - 1) {
    var middle = Math.floor((i1 + i2) / 2);
    var arrm = arr[middle].plain || arr[middle];
    if (arrm.version < version) {
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
 * @param {String} [options.WorkflowTableName]
 * @param {String} [options.UsertypeTableName]
 * @param {DbSync} [options.sync]
 * @param {Calculator} [options.calc]
 * @constructor
 */
function DsMetaRepository(options) {

  var _this = this;

  /**
   * @type {String}
   */
  this.userTypeTableName = options.UsertypeTableName || 'ion_usertype';

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
   * @type {String}
   */
  this.workflowTableName = options.WorkflowTableName || 'ion_workflow';

  /**
   * @type {DataSource}
   */
  this.ds = null;

  /**
   * @type {DbSync}
   */
  this.sync = options.sync;

  this.classMeta = {};

  this.workflowMeta = {};

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

  this.userTypes = {};

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
      if (!_this.classMeta[ns]) {
        throw new Error('Пространство имен ' + namespace + ' не найдено.');
      }
      if (_this.classMeta[ns].hasOwnProperty(name)) {
        if (version) {
          if (typeof _this.classMeta[ns][name][version] !== 'undefined') {
            return _this.classMeta[ns][name].byVersion[version];
          } else {
            var cm = findByVersion(_this.classMeta[ns][name].byOrder, version);
            if (cm) {
              return cm;
            }
          }
        }
        if (_this.classMeta[ns][name][defaultVersion]) {
          return _this.classMeta[ns][name][defaultVersion];
        }
      }
    } catch (err) {
      throw err;
    }
    throw new Error('Класс ' + name + '(вер.' + version + ') не найден в пространстве имен ' + namespace + '!');
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
    var src = {};

    src = this.navMeta.roots;

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
    result.sort(function (a, b) {
      return a.orderNumber - b.orderNumber;
    });
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

  this._getListViewModel = function (classname, node, namespace, version) {
    var meta = this._getMeta(classname, version, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.listModels);
    if (!vm && meta.getAncestor()) {
      return this._getListViewModel(meta.getAncestor().getCanonicalName(), node, namespace);
    }
    return vm;
  };

  this._getCollectionViewModel = function (classname, collection, node, namespace, version) {
    var meta = this._getMeta(classname, version, namespace);
    return getViewModel(node, meta, this.viewMeta.collectionModels);
  };

  this._getItemViewModel = function (classname, node, namespace, version) {
    var meta = this._getMeta(classname, version, namespace);
    var vm = getViewModel(node, meta, this.viewMeta.itemModels);
    if (!vm && meta.getAncestor()) {
      return this._getItemViewModel(meta.getAncestor().getCanonicalName(), node, namespace, version);
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

  this._getCreationViewModel = function (classname, node, namespace, version) {
    var meta = this._getMeta(classname, version, namespace);
    return getCVM(node, meta);
  };

  this._getDetailViewModel = function (classname, node, namespace, version) {
    var meta = this._getMeta(classname, version, namespace);
    return getViewModel(node, meta, this.viewMeta.detailModels);
  };

  /**
   * @param {ClassMeta} meta
   * @param {String} name
   * @returns {*}
   */
  function getWorkflows(meta, name) {
    var tmp, nm;
    var ns = formNS(meta.getNamespace());
    var result = [];

    if (_this.workflowMeta.hasOwnProperty(ns)) {
      if (_this.workflowMeta[ns].hasOwnProperty(meta.getName())) {
        if (name) {
          if (_this.workflowMeta[ns][meta.getName()].hasOwnProperty(name)) {
            tmp = findByVersion(_this.workflowMeta[ns][meta.getName()][name], meta.getVersion());
            if (tmp) {
              result.push(tmp);
            }
          }
        } else {
          for (nm in _this.workflowMeta[ns][meta.getName()]) {
            if (_this.workflowMeta[ns][meta.getName()].hasOwnProperty(nm)) {
              tmp = findByVersion(_this.workflowMeta[ns][meta.getName()][nm], meta.getVersion());
              if (tmp) {
                result.push(tmp);
              }
            }
          }
        }
      }

      if (meta.getAncestor()) {
        Array.prototype.push.apply(result, getWorkflows(meta.getAncestor(), name));
      }
    }
    return result;
  }

  /**
   * @param {String} className
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object[] | null}
   */
  this._getWorkflows = function (className, namespace, version) {
    var meta = this._getMeta(className, version, namespace);
    return getWorkflows(meta);
  };

  /**
   * @param {String} className
   * @param {String} name
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object[] | null}
   */
  this._getWorkflow = function (className, name, namespace, version) {
    var meta = this._getMeta(className, version, namespace);
    var wfs = getWorkflows(meta, name);
    if (wfs.length > 0) {
      return wfs[0];
    }
    return null;
  };

  /**
   * @param {String} className
   * @param {String} workflow
   * @param {String} state
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object[] | null}
   */
  this._getWorkflowView = function (className, workflow, state, namespace, version) {
    var cm = this._getMeta(className, version, namespace);
    if (cm) {
      if (_this.viewMeta.workflowModels[workflow] &&
        _this.viewMeta.workflowModels[workflow][state] &&
        _this.viewMeta.workflowModels[workflow][state][cm.getCanonicalName()]) {
        return _this.viewMeta.workflowModels[workflow][state][cm.getCanonicalName()];
      }
    }
    return null;
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
  function expandProperty(cm) {
    var pm, i, j, ut;
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
          expandProperty(structClass);
        }
        var spms = structClass.getPropertyMetas();
        for (j = 0; j < spms.length; j++) {
          pm = clone(spms[j]);
          pm.name = cm.plain.properties[i].name + '$' + pm.name;
          cm.propertyMetas[pm.name] = pm;
        }
      }
    }
    for (var nm in cm.propertyMetas) {
      if (cm.propertyMetas.hasOwnProperty(nm)) {
        pm = cm.propertyMetas[nm];
        if (pm.type === PropertyTypes.CUSTOM) {
          if (pm.refClass) {
            if (_this.userTypes.hasOwnProperty(pm.refClass)) {
              ut = _this.userTypes[pm.refClass];
              if (ut) {
                pm.type = ut.type || PropertyTypes.STRING;
                pm.mask = ut.mask || pm.mask;
                pm.maskName = ut.maskName || pm.maskName;
                pm.size = ut.size || pm.size;
                pm.decimals = ut.decimals || pm.decimals;
                pm.validators = ut.validators || pm.validators || [];
              }
            }
          }
        }
      }
    }
    cm.___structs_expanded = true;
  }

  function acceptUserTypes(types) {
    for (var i = 0; i < types.length; i++) {
      _this.userTypes[types[i].name] = types[i];
    }
  }

  function propertyGetter(prev, propertyName, start, length) {
    return function (dateCallback, circular) {
      var p = this.property(propertyName);
      var tmp = p.getDisplayValue(dateCallback, circular);

      if (start && typeof tmp === 'string') {
        tmp = tmp.substr(start, length || null);
      }

      if (typeof prev === 'function') {
        return prev.call(this, dateCallback, circular) + tmp;
      }

      return tmp;
    };
  }

  function constGetter(prev, v) {
    return function (dateCallback, circular) {
      if (typeof prev === 'function') {
        return prev.call(this, dateCallback, circular) + v;
      }
      return v;
    };
  }

  /**
   * @param {String[]} path
   * @param {ClassMeta} cm
   */
  function locatePropertyMeta(path, cm) {
    var pm = cm.getPropertyMeta(path[0]);
    if (pm) {
      if (path.length === 1) {
        return pm;
      }

      if (pm.type === PropertyTypes.REFERENCE) {
        var rcm = _this._getMeta(pm.refClass, cm.getVersion(), cm.getNamespace());
        if (rcm) {
          return locatePropertyMeta(path.slice(1), rcm);
        }
      }
    }
    return null;
  }

  /**
   * @param {String} semantic
   * @param {ClassMeta} cm
   * @returns {*}
   */
  function createSemanticFunc(semantic, cm, forceEnrichment, semanticAttrs, prefix) {
    var tmp, pm, result, ppath, re;
    re = /^\w[\w\.]*\w$/;
    var parts = semantic.split('|');
    for (var i = 0; i < parts.length; i++) {
      tmp = /^([^\s\[]+)\s*(\[\s*(\d+)(\s*,\s*(\d+))?\s*\])?$/.exec(parts[i].trim());
      if (tmp) {
        if (semanticAttrs && re.test(tmp[1])) {
          semanticAttrs.push(tmp[1]);
        }
        ppath = tmp[1].split('.');
        pm = locatePropertyMeta(ppath, cm);
        if (pm) {
          if (forceEnrichment) {
            if (prefix) {
              ppath.unshift(prefix);
            }
            if (pm.type !== PropertyTypes.REFERENCE && pm.type !== PropertyTypes.COLLECTION) {
              ppath.pop();
            }
            if (ppath.length) {
              forceEnrichment.push(ppath);
            }
          }
          result = propertyGetter(result, tmp[1], tmp[3], tmp[5]);
        } else {
          result = constGetter(result, parts[i]);
        }
      } else {
        result = constGetter(result, parts[i]);
      }
    }
    return result;
  }

  /**
   * @param {ClassMeta} cm
   */
  function produceSemantics(cm) {
    var i, propertyMetas;

    if (cm) {
      propertyMetas = cm.getPropertyMetas();

      for (i = 0; i < propertyMetas.length; i++) {
        if ((propertyMetas[i].type === PropertyTypes.REFERENCE ||
          propertyMetas[i].type === PropertyTypes.COLLECTION) &&
          propertyMetas[i].semantic) {
          propertyMetas[i].semanticGetter = createSemanticFunc(
            propertyMetas[i].semantic,
            propertyMetas[i]._refClass,
            [],
            null,
            propertyMetas[i].name
          );
        }
      }
      if (cm.plain.semantic) {
        cm._semanticFunc = createSemanticFunc(cm.plain.semantic, cm, cm._forcedEnrichment, cm._semanticAttrs);
      }
    }
  }

  function acceptClassMeta(metas) {
    var i, j, name, ns, cm, pms, pm;
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
              /**
               * @type {ClassMeta}
               */
              cm = _this.classMeta[ns][name].byOrder[i];
              if (cm.plain.ancestor) {
                try {
                  cm.ancestor = _this._getMeta(cm.plain.ancestor, cm.plain.version, cm.namespace);
                  cm.ancestor.descendants.push(cm);
                } catch (e) {
                  throw new Error('Не найден родительский класс "' + cm.plain.ancestor + '" класса ' +
                    cm.getCanonicalName() + '.');
                }
              }

              pms = cm.getPropertyMetas();
              for (j = 0; j < pms.length; j++) {
                pm = pms[j];
                if (pm.type === PropertyTypes.REFERENCE && typeof pm.refClass !== 'undefined') {
                  try {
                    pm._refClass = _this._getMeta(pm.refClass, cm.plain.version, cm.namespace);
                  } catch (e) {
                    throw new Error('Не найден класс "' + pm.refClass + '" по ссылке атрибута ' +
                      cm.getCanonicalName() + '.' + pm.name + '.');
                  }
                } else if (pm.type === PropertyTypes.COLLECTION && typeof pm.itemsClass !== 'undefined') {
                  try {
                    pm._refClass = _this._getMeta(pm.itemsClass, cm.plain.version, cm.namespace);
                  } catch (e) {
                    throw new Error('Не найден класс "' + pm.itemsClass + '" по ссылке атрибута ' +
                      cm.getCanonicalName() + '.' + pm.name + '.');
                  }
                }
                if (pm.formula && options.calc instanceof Calculator) {
                  pm._formula = options.calc.parseFormula(pm.formula);
                }
                if (pm.defaultValue && pm.defaultValue.indexOf('(') > 0 && options.calc instanceof Calculator) {
                  pm._dvFormula = options.calc.parseFormula(pm.defaultValue);
                }
              }
            }
          }
        }

        for (name in _this.classMeta[ns]) {
          if (_this.classMeta[ns].hasOwnProperty(name)) {
            for (i = 0; i < _this.classMeta[ns][name].byOrder.length; i++) {
              cm = _this.classMeta[ns][name].byOrder[i];
              expandProperty(cm);
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
      workflowModels: {},
      masks: {},
      validators: {}
    };

    for (var i = 0; i < views.length; i++) {
      switch (views[i].type){
        case 'list': assignVm(_this.viewMeta.listModels, sortViewElements(views[i])); break;
        case 'collection': assignVm(_this.viewMeta.collectionModels, sortViewElements(views[i])); break;
        case 'item': {
          if (views[i].path.split('.')[0] === 'workflows') {
            var pathParts = views[i].path.split('.');
            var wf = pathParts[1];
            var state = pathParts[2];
            var cm = _this._getMeta(views[i].className, views[i].version, views[i].namespace);
            if (cm) {
              if (!_this.viewMeta.workflowModels.hasOwnProperty(wf)) {
                _this.viewMeta.workflowModels[wf] = {};
              }
              if (!_this.viewMeta.workflowModels[wf].hasOwnProperty(state)) {
                _this.viewMeta.workflowModels[wf][state] = {};
              }
              _this.viewMeta.workflowModels[wf][state][cm.getCanonicalName()] = views[i];
            }
          } else {
            assignVm(_this.viewMeta.itemModels, sortViewElements(views[i]));
          }
        } break;
        case 'create': assignVm(_this.viewMeta.createModels, sortViewElements(views[i])); break;
        case 'detail': assignVm(_this.viewMeta.detailModels, sortViewElements(views[i])); break;
        case 'masks': _this.viewMeta.masks[views[i].name] = views[i]; break;
        case 'validators': _this.viewMeta.validators[views[i].name] = views[i]; break;
        default: break;
      }
    }
  }

  function acceptWorkflows(workflows) {
    var i, j, k, ns, wf;
    _this.workflowMeta = {};

    for (i = 0; i < workflows.length; i++) {
      wf = workflows[i];
      ns = formNS(wf.namespace);
      if (!_this.workflowMeta.hasOwnProperty(ns)) {
        _this.workflowMeta[ns] = {};
      }
      if (!_this.workflowMeta[ns].hasOwnProperty(wf.wfClass)) {
        _this.workflowMeta[ns][wf.wfClass] = {};
      }
      if (!_this.workflowMeta[ns][wf.wfClass].hasOwnProperty(wf.name)) {
        _this.workflowMeta[ns][wf.wfClass][wf.name] = [];
      }

      wf.statesByName = {};
      for (j = 0; j < wf.states.length; j++) {
        wf.statesByName[wf.states[j].name] = wf.states[j];
      }

      wf.transitionsByName = {};
      wf.transitionsBySrc = {};
      wf.transitionsByDest = {};

      for (j = 0; j < wf.transitions.length; j++) {
        for (k = 0; k < wf.transitions[j].assignments.length; k++) {
          if (
            wf.transitions[j].assignments[k].value &&
            wf.transitions[j].assignments[k].value.indexOf('(') !== -1 &&
            wf.transitions[j].assignments[k].value.indexOf(')') !== -1 &&
            options.calc
          ) {
            wf.transitions[j].assignments[k]._formula =
              options.calc.parseFormula(wf.transitions[j].assignments[k].value);
          }
        }
        wf.transitionsByName[wf.transitions[j].name] = wf.transitions[j];
        if (!wf.transitionsBySrc.hasOwnProperty(wf.transitions[j].startState)) {
          wf.transitionsBySrc[wf.transitions[j].startState] = [];
        }
        wf.transitionsBySrc[wf.transitions[j].startState].push(wf.transitions[j]);

        if (!wf.transitionsByDest.hasOwnProperty(wf.transitions[j].finishState)) {
          wf.transitionsByDest[wf.transitions[j].finishState] = [];
        }
        wf.transitionsByDest[wf.transitions[j].finishState].push(wf.transitions[j]);
      }

      _this.workflowMeta[ns][wf.wfClass][wf.name].push(wf);
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
        if (_this.navMeta.sections.hasOwnProperty(n.section) &&
          n.code.indexOf('.') === -1) {
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

    for (name in _this.navMeta.nodes[ns]) {
      if (_this.navMeta.nodes.hasOwnProperty(name)) {
        _this.navMeta.nodes[name].children.sort(function (a, b) {
          return a.orderNumber - b.orderNumber;
        });
      }
    }
  }

  function init() {
    return Promise.all(
        [
          _this.ds.fetch(_this.userTypeTableName, {sort: {name: 1}}),
          _this.ds.fetch(_this.metaTableName, {sort: {name: 1, version: 1}}),
          _this.ds.fetch(_this.viewTableName, {sort: {type: 1, className: 1, path: 1, version: 1}}),
          _this.ds.fetch(_this.navTableName, {sort: {itemType: -1, name: 1}}),
          _this.ds.fetch(_this.workflowTableName, {sort: {wfClass: 1, name: 1, version: 1}})
        ]
      ).then(
        function (results) {
          try {
            acceptUserTypes(results[0]);
            acceptClassMeta(results[1]);
            acceptViews(results[2]);
            acceptNavigation(results[3]);
            acceptWorkflows(results[4]);
            return Promise.resolve();
          } catch (err) {
            return Promise.reject(err);
          }
        }
      );
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
