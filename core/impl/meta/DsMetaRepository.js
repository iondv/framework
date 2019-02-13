/* eslint no-invalid-this:off */

/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */
'use strict';

const MetaRepositoryModule = require('core/interfaces/MetaRepository');
const MetaRepository = MetaRepositoryModule.MetaRepository;
const ClassMeta = MetaRepositoryModule.ClassMeta;
const PropertyTypes = require('core/PropertyTypes');
const Calculator = require('core/interfaces/Calculator');
const conditionParser = require('core/ConditionParser');
const clone = require('clone');
const merge = require('merge');

const defaultVersion = '___default';

/* jshint maxstatements: 60, maxcomplexity: 25, maxdepth: 20 */

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {String} [options.MetaTableName]
 * @param {String} [options.ViewTableName]
 * @param {String} [options.NavTableName]
 * @param {String} [options.WorkflowTableName]
 * @param {String} [options.UsertypeTableName]
 * @param {DbSync} [options.sync]
 * @param {Logger} [options.log]
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
   * @type {DbSync}
   */
  var sync = options.sync;

  /**
   * @type {DataSource}
   */
  var ds = options.dataSource;

  if (!ds) {
    throw 'Не указан источник данных мета репозитория!';
  }

  var classMeta = {};

  var workflowMeta = {};

  var viewMeta = {
    listModels: {},
    collectionModels: {},
    itemModels: {},
    createModels: {},
    detailModels: {},
    masks: {},
    validators: {}
  };

  var navMeta = {
    sections: {},
    nodes: {},
    classnames: {}
  };

  var userTypes = {};

  function viewPath(nodeCode, className) {
    return (nodeCode ? nodeCode + '/' : '') + className;
  }

  function formNS(ns) {
    return 'ns_' + (ns ? ns : '');
  }

  /**
   * @param {String} name
   * @param {Boolean} [rev]
   * @returns {{name: String, namespace: String}}
   */
  function parseCanonicalName(name, rev) {
    let parts = name.split('@');
    if (parts.length > 1) {
      let result = {};
      result[rev ? 'namespace' : 'name'] = parts[0];
      result[rev ? 'name' : 'namespace'] = parts[1];
      return result;
    }
    return {name: name};
  }

  function assignVm(coll, vm) {
    let cn = vm.className;
    if (cn.indexOf('@') < 0) {
      cn = cn + '@' + vm.namespace;
    }
    let vp = viewPath(vm.path, cn);
    if (!coll.hasOwnProperty(vp)) {
      coll[vp] = [];
    }

    coll[vp].push(vm);
  }

  function findByVersion(arr, version, i1, i2) {
    if (!i1) { i1 = 0; }
    if (!i2) { i2 = arr.length - 1; }

    let arr1 = arr[i1].plain || arr[i1];
    let arr2 = arr[i2].plain || arr[i2];

    if (arr1.version === version) {
      return arr[i1];
    }

    if (arr2.version === version) {
      return arr[i2];
    }

    if (i1 < i2 - 1) {
      let middle = Math.floor((i1 + i2) / 2);
      let arrm = arr[middle].plain || arr[middle];
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
   * @param {String} name
   * @param {String} [version]
   * @param {String} [namespace]
   * @returns {ClassMeta}
   */
  function getFromMeta(name, version, namespace) {
    let cn = parseCanonicalName(name);
    name = cn.name;
    namespace = cn.namespace || namespace;
    try {
      let ns = formNS(namespace);
      if (classMeta[ns] && classMeta[ns].hasOwnProperty(name)) {
        if (version) {
          if (typeof classMeta[ns][name][version] !== 'undefined') {
            return classMeta[ns][name].byVersion[version];
          } else {
            let cm = findByVersion(classMeta[ns][name].byOrder, version);
            if (cm) {
              return cm;
            }
          }
        }
        if (classMeta[ns][name][defaultVersion]) {
          return classMeta[ns][name][defaultVersion];
        }
      }
    } catch (err) {
      throw err;
    }
    throw new Error('Класс ' + name + (version ? ' (вер.' + version + ')' : '') + ' не найден в пространстве имен ' + namespace + '!');
  }

  this._getMeta = function (name, version, namespace) {
    return getFromMeta(name, version, namespace);
  };

  this._listMeta = function (ancestor, version, direct, namespace) {
    let result = [];

    function fillDescendants(src) {
      result = result.concat(src);
      for (let i = 0; i < src.length; i++) {
        fillDescendants(src[i].getDescendants());
      }
    }

    if (ancestor) {
      let cm = getFromMeta(ancestor, version, namespace);
      if (direct) {
        return cm.getDescendants();
      } else {
        fillDescendants(cm.getDescendants());
        return result;
      }
    } else {
      let ns = formNS(namespace);
      for (let nm  in classMeta) {
        if (classMeta.hasOwnProperty(nm) && ns === nm || !namespace) {
          for (let cn in classMeta[nm]) {
            if (classMeta[nm].hasOwnProperty(cn)) {
              if (version) {
                if (classMeta[nm][cn].hasOwnProperty(version)) {
                  result.push(classMeta[nm][cn].byVersion[version]);
                  continue;
                }
                let cm = findByVersion(classMeta[nm][cn].byOrder, version);
                if (cm) {
                  result.push(cm);
                }
              } else {
                Array.prototype.push.apply(result, classMeta[nm][cn].byOrder);
              }
            }
          }
        }
      }
      return result;
    }
  };

  this._ancestor = function (classname,version, namespace) {
    return getFromMeta(classname, version, namespace).getAncestor();
  };

  this._propertyMetas = function (classname,version, namespace) {
    return getFromMeta(classname, version, namespace).getPropertyMetas();
  };

  this._getNavigationSections = function (namespace) {
    if (namespace) {
      let ns = formNS(namespace);
      if (navMeta.sections.hasOwnProperty(ns)) {
        return navMeta.sections[ns];
      }
    } else {
      let result = {};
      for (let ns in navMeta.sections) {
        if (navMeta.sections.hasOwnProperty(ns)) {
          result = merge(result, navMeta.sections[ns]);
        }
      }
      return result;
    }
    return {};
  };

  this._getNavigationSection = function (code, namespace) {
    let sn = parseCanonicalName(code, true);
    code = sn.name;
    let ns = formNS(sn.namespace || namespace);
    if (navMeta.sections.hasOwnProperty(ns) && navMeta.sections[ns].hasOwnProperty(code)) {
      return navMeta.sections[ns][code];
    }
    return null;
  };

  this._getNodes = function (section, parent, namespace) {
    let sn = parseCanonicalName(section, true);
    section = sn.name;
    let ns = formNS(sn.namespace || namespace);
    let result = [];
    let src = {};

    if (navMeta.roots.hasOwnProperty(ns)) {
      src = navMeta.roots[ns];
    }

    if (section && navMeta.sections.hasOwnProperty(ns) && navMeta.sections[ns].hasOwnProperty(section)) {
      src = navMeta.sections[ns][section].nodes;
    }

    if (parent) {
      if (src.hasOwnProperty(parent)) {
        return src[parent].children;
      } else {
        return [];
      }
    }

    for (let code in src) {
      if (src.hasOwnProperty(code)) {
        result.push(src[code]);
      }
    }
    result.sort((a, b) => a.orderNumber - b.orderNumber);
    return result;
  };

  this._getNode = function (code, namespace) {
    let nn = parseCanonicalName(code, true);
    code = nn.name;
    let ns = formNS(nn.namespace || namespace);
    if (navMeta.nodes.hasOwnProperty(ns) && navMeta.nodes[ns].hasOwnProperty(code)) {
      return navMeta.nodes[ns][code];
    }
    return null;
  };

  this._getNodeForClassname = function (className, namespace) {
    let cn = parseCanonicalName(className);
    let ns = formNS(namespace || cn.namespace);
    if (navMeta.classnames.hasOwnProperty(ns) &&
      navMeta.classnames[ns].hasOwnProperty(cn.namespace ? className : className + '@' + namespace)) {
      return navMeta.classnames[ns][cn.namespace ? className : className + '@' + namespace];
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
    let path = viewPath(node, meta.getCanonicalName());
    let gpath = viewPath(null, meta.getCanonicalName());
    if (coll.hasOwnProperty(path)) {
      return findByVersion(coll[path], meta.getVersion()); // TODO locate model in parent nodes
    } else if (coll.hasOwnProperty(gpath)) {
      return findByVersion(coll[gpath], meta.getVersion());
    } else if (meta.getAncestor()) {
      return getViewModel(node, meta.getAncestor(), coll);
    }
    return null;
  }

  this._getListViewModel = function (classname, node, namespace, version) {
    let meta = this._getMeta(classname, version, namespace);
    let vm = getViewModel(node, meta, viewMeta.listModels);
    if (!vm && meta.getAncestor()) {
      return this._getListViewModel(meta.getAncestor().getCanonicalName(), node, namespace);
    }
    return vm;
  };

  this._getCollectionViewModel = function (classname, collection, node, namespace, version) {
    let meta = this._getMeta(classname, version, namespace);
    return getViewModel(node, meta, viewMeta.collectionModels);
  };

  this._getItemViewModel = function (classname, node, namespace, version) {
    let meta = this._getMeta(classname, version, namespace);
    let vm = getViewModel(node, meta, viewMeta.itemModels);
    if (!vm && meta.getAncestor()) {
      return this._getItemViewModel(meta.getAncestor().getCanonicalName(), node, namespace, version);
    }
    return vm;
  };

  function getCVM(node, meta) {
    let vm = getViewModel(node, meta, viewMeta.createModels);
    if (!vm) {
      vm = getViewModel(node, meta, viewMeta.itemModels);
    }
    if (!vm && meta.getAncestor()) {
      return getCVM(node, meta.getAncestor());
    }
    return vm;
  }

  this._getCreationViewModel = function (classname, node, namespace, version) {
    let meta = this._getMeta(classname, version, namespace);
    return getCVM(node, meta);
  };

  this._getDetailViewModel = function (classname, node, namespace, version) {
    let meta = this._getMeta(classname, version, namespace);
    return getViewModel(node, meta, viewMeta.detailModels);
  };

  /**
   * @param {ClassMeta} meta
   * @param {String} name
   * @returns {*}
   */
  function getWorkflows(meta, name) {
    let result = [];

    if (name) {
      let wfn = parseCanonicalName(name);
      let ns = formNS(wfn.namespace || meta.getNamespace());
      if (workflowMeta.hasOwnProperty(ns)) {
        if (workflowMeta[ns].hasOwnProperty(meta.getCanonicalName())) {
          if (workflowMeta[ns][meta.getCanonicalName()].hasOwnProperty(wfn.name)) {
            let tmp = findByVersion(workflowMeta[ns][meta.getCanonicalName()][wfn.name], meta.getVersion());
            if (tmp) {
              result.push(tmp);
            }
          }
        }
      }
    } else {
      for (let ns in workflowMeta) {
        if (workflowMeta.hasOwnProperty(ns)) {
          if (workflowMeta[ns].hasOwnProperty(meta.getCanonicalName())) {
            for (let nm in workflowMeta[ns][meta.getCanonicalName()]) {
              if (workflowMeta[ns][meta.getCanonicalName()].hasOwnProperty(nm)) {
                let tmp = findByVersion(workflowMeta[ns][meta.getCanonicalName()][nm], meta.getVersion());
                if (tmp) {
                  result.push(tmp);
                }
              }
            }
          }
        }
      }
    }

    if (meta.getAncestor()) {
      Array.prototype.push.apply(result, getWorkflows(meta.getAncestor(), name));
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
    let meta = this._getMeta(className, version, namespace);
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
    let meta = this._getMeta(className, version, namespace);
    let wfs = getWorkflows(meta, name);
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
    let cm = this._getMeta(className, version, namespace);
    if (cm) {
      if (viewMeta.workflowModels[workflow] &&
        viewMeta.workflowModels[workflow][state] &&
        viewMeta.workflowModels[workflow][state][cm.getCanonicalName()]) {
        return viewMeta.workflowModels[workflow][state][cm.getCanonicalName()];
      }
    }
    return null;
  };

  this._getMask = function (name) {
    if (viewMeta.masks.hasOwnProperty(name)) {
      return viewMeta.masks[name];
    }
    return null;
  };

  this._getValidators = function () {
    return viewMeta.validators;
  };

  /**
   * @param {ClassMeta} cm
   */
  function setupSelections(cm) {
    function selectionConstructor1() {
      return function () {
        return this.list || [];
      };
    }

    function selectionConstructor2() {
      /**
       * @param {Item} item
       */
      return function (item) {
        let result = [];
        for (let j = 0; j < this.matrix.length; j++) {
          if (!this.matrix[j]._checker) {
            Array.prototype.push.apply(result, this.matrix[j].result || []);
          } if (typeof this.matrix[j]._checker === 'function') {
            let cr = this.matrix[j]._checker.apply(item);
            if (cr) {
              if (cr instanceof Promise) {
                throw new Error('Асинхронные вызовы в условиях соответствия списков выбора недопустимы!');
              }
              Array.prototype.push.apply(result, this.matrix[j].result || []);
            }
          }
        }
        return result;
      };
    }

    for (let nm in cm.propertyMetas) {
      if (cm.propertyMetas.hasOwnProperty(nm)) {
        let pm = cm.propertyMetas[nm];
        if (pm.selectionProvider) {
          if (pm.selectionProvider.type === 'SIMPLE') {
            pm.selectionProvider.getSelection = selectionConstructor1();
          } else if (pm.selectionProvider.type === 'MATRIX') {
            let matrix = pm.selectionProvider.matrix;
            for (let j = 0; j < matrix.length; j++) {
              if (matrix[j].conditions) {
                if (Array.isArray(matrix[j].conditions)) {
                  matrix[j].conditions = conditionParser(matrix[j].conditions, cm, null);
                }
                matrix[j]._checker = options.calc.parseFormula(matrix[j].conditions);
              }
            }
            pm.selectionProvider.getSelection = selectionConstructor2();
          }
        }
      }
    }
  }

  /**
   * @param {ClassMeta} cm
   */
  function expandProperty(cm) {
    for (let i = 0; i < cm.plain.properties.length; i++) {
      if (cm.plain.properties[i].type === PropertyTypes.STRUCT) {
        let structClass;
        try {
          structClass = getFromMeta(cm.plain.properties[i].refClass, cm.plain.version, cm.getNamespace());
        } catch (err) {
          throw new Error('Не найден класс [' + cm.plain.properties[i].refClass +
            '] для структуры [' + cm.plain.caption + '].[' + cm.plain.properties[i].caption + ']');
        }
        if (!structClass.___structs_expanded) {
          expandProperty(structClass);
        }
        let spms = structClass.getPropertyMetas();
        for (let j = 0; j < spms.length; j++) {
          let pm = clone(spms[j]);
          pm.name = cm.plain.properties[i].name + '$' + pm.name;
          cm.propertyMetas[pm.name] = pm;
        }
      }
    }
    for (let nm in cm.propertyMetas) {
      if (cm.propertyMetas.hasOwnProperty(nm)) {
        let pm = cm.propertyMetas[nm];
        if (pm.type === PropertyTypes.CUSTOM) {
          if (pm.refClass) {
            if (userTypes.hasOwnProperty(pm.refClass)) {
              let ut = userTypes[pm.refClass];
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
    for (let i = 0; i < types.length; i++) {
      userTypes[types[i].name] = types[i];
    }
  }

  function propertyGetter(prev, propertyName, start, length) {
    return function (dateCallback, circular) {
      let p = this.property(propertyName);
      let tmp = p.getDisplayValue(dateCallback, circular);

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
    let pm = cm.getPropertyMeta(path[0]);
    if (pm) {
      if (path.length === 1) {
        return pm;
      }

      if (pm.type === PropertyTypes.REFERENCE) {
        let rcm = _this._getMeta(pm.refClass, cm.getVersion(), cm.getNamespace());
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
    let result;
    let re = /^\w[\w.]*\w$/;
    let parts = semantic.split('|');
    for (let i = 0; i < parts.length; i++) {
      let tmp = /^([^\s[]+)\s*(\[\s*(\d+)(\s*,\s*(\d+))?\s*\])?$/.exec(parts[i].trim());
      if (tmp) {
        if (semanticAttrs && re.test(tmp[1])) {
          semanticAttrs.push(tmp[1]);
        }
        let ppath = tmp[1].split('.');
        let pm = locatePropertyMeta(ppath, cm);
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
    if (cm) {
      let propertyMetas = cm.getPropertyMetas();

      for (let i = 0; i < propertyMetas.length; i++) {
        if ((propertyMetas[i].type === PropertyTypes.REFERENCE ||
          propertyMetas[i].type === PropertyTypes.COLLECTION) &&
          propertyMetas[i].semantic) {
          propertyMetas[i].semanticGetter = createSemanticFunc(
            propertyMetas[i].semantic,
            propertyMetas[i]._refClass,
            cm._forcedEnrichment,
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
    classMeta = {};
    for (let i = 0; i < metas.length; i++) {
      let ns = formNS(metas[i].namespace);
      if (!classMeta.hasOwnProperty(ns)) {
        classMeta[ns] = {};
      }

      if (!classMeta[ns].hasOwnProperty(metas[i].name)) {
        classMeta[ns][metas[i].name] = {
          byVersion: {},
          byOrder: []
        };
      }
      let cm = new ClassMeta(metas[i]);
      cm.namespace = metas[i].namespace;
      classMeta[ns][metas[i].name].byVersion[metas[i].version] = cm;
      classMeta[ns][metas[i].name].byOrder.push(cm);
      classMeta[ns][metas[i].name][defaultVersion] = cm;
    }

    for (let ns in classMeta) {
      if (classMeta.hasOwnProperty(ns)) {
        for (let name in classMeta[ns]) {
          if (classMeta[ns].hasOwnProperty(name)) {
            for (let i = 0; i < classMeta[ns][name].byOrder.length; i++) {
              /**
               * @type {ClassMeta}
               */
              let cm = classMeta[ns][name].byOrder[i];
              if (cm.plain.ancestor) {
                try {
                  cm.ancestor = _this._getMeta(cm.plain.ancestor, cm.plain.version, cm.namespace);
                  cm.ancestor.descendants.push(cm);
                } catch (e) {
                  throw new Error('Не найден родительский класс "' + cm.plain.ancestor + '" класса ' +
                    cm.getCanonicalName() + '.');
                }
              }

              let pms = cm.getPropertyMetas();
              for (let j = 0; j < pms.length; j++) {
                let pm = pms[j];
                if (typeof pm.mode === 'undefined') {
                  pm.mode = 0;
                }
                if (pm.type === PropertyTypes.REFERENCE && typeof pm.refClass !== 'undefined') {
                  try {
                    pm._refClass = _this._getMeta(pm.refClass, cm.plain.version, cm.getNamespace());
                  } catch (e) {
                    throw new Error(
                      'Не найден класс "' + pm.refClass + '" по ссылке атрибута ' +
                      cm.getCanonicalName() + '.' + pm.name + '.'
                    );
                  }
                } else if (pm.type === PropertyTypes.COLLECTION && typeof pm.itemsClass !== 'undefined') {
                  try {
                    pm._refClass = _this._getMeta(pm.itemsClass, cm.plain.version, cm.namespace);
                  } catch (e) {
                    throw new Error(
                      'Не найден класс "' + pm.itemsClass + '" по ссылке атрибута ' +
                      cm.getCanonicalName() + '.' + pm.name + '.'
                    );
                  }
                }
                if (pm.formula && options.calc instanceof Calculator) {
                  try {
                    if (typeof pm.formula === 'string') {
                      (options.log || console).warn(
                        'Формула вычисляемого атрибута "' + cm.getCanonicalName() + '.' + pm.name +
                        '" задана в строковом виде. Этот формат является устаревшим и будет исключен в следующих версиях.'
                      );
                    }
                    pm._formula = options.calc.parseFormula(pm.formula);
                  } catch (e) {
                    throw new Error(
                      'Некорректно задана формула для вычисляемого атрибута "' +
                      cm.getCanonicalName() + '.' + pm.name + '": ' + e.message
                    );
                  }
                }
                if (
                  pm.defaultValue &&
                  (
                    typeof pm.defaultValue === 'object' ||
                    (pm.defaultValue.indexOf('(') > 0 && pm.defaultValue.indexOf(')') > 0)
                  ) &&
                  options.calc instanceof Calculator
                ) {
                  try {
                    pm._dvFormula = options.calc.parseFormula(pm.defaultValue);
                    if (typeof pm.defaultValue === 'string') {
                      (options.log || console).warn(
                        'Формула значения по умолчанию атрибута "' + cm.getCanonicalName() + '.' + pm.name +
                        '" задана в строковом виде. Этот формат является устаревшим и будет исключен в следующих версиях.'
                      );
                    }
                  } catch (e) {
                    pm._dvFormula = null;
                  }
                }
              }
            }
          }
        }

        for (let name in classMeta[ns]) {
          if (classMeta[ns].hasOwnProperty(name)) {
            for (let i = 0; i < classMeta[ns][name].byOrder.length; i++) {
              let cm = classMeta[ns][name].byOrder[i];
              expandProperty(cm);
              setupSelections(cm);
              produceSemantics(cm);
            }
          }
        }
      }
    }
  }

  function sortViewElements(src) {
    if (typeof src.columns !== 'undefined' && src.columns.length) {
      src.columns.sort((a, b) => a.orderNumber - b.orderNumber);
      for (let i = 0; i < src.columns.length; i++) {
        sortViewElements(src.columns[i]);
      }
    }

    if (typeof src.tabs !== 'undefined' && src.tabs.length) {
      for (let i = 0; i < src.tabs.length; i++) {
        sortViewElements(src.tabs[i]);
      }
    }

    if (typeof src.fullFields !== 'undefined' && src.fullFields.length) {
      src.fullFields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (let i = 0; i < src.fullFields.length; i++) {
        sortViewElements(src.fullFields[i]);
      }
    }

    if (typeof src.shortFields !== 'undefined' && src.shortFields.length) {
      src.shortFields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (let i = 0; i < src.shortFields.length; i++) {
        sortViewElements(src.shortFields[i]);
      }
    }

    if (typeof src.fields !== 'undefined' && src.fields.length) {
      src.fields.sort(function (a, b) {return a.orderNumber - b.orderNumber;});
      for (let i = 0; i < src.fields.length; i++) {
        sortViewElements(src.fields[i]);
      }
    }
    return src;
  }

  function compileStyles(vm) {
    if (vm.styles && typeof vm.styles === 'object' && options.calc) {
      for (let cn in vm.styles) {
        if (vm.styles.hasOwnProperty(cn)) {
          vm.styles[cn] = options.calc.parseFormula(vm.styles[cn]);
        }
      }
    }
    return vm;
  }

  function acceptViews(views) {
    viewMeta = {
      listModels: {},
      collectionModels: {},
      itemModels: {},
      createModels: {},
      detailModels: {},
      workflowModels: {},
      masks: {},
      validators: {}
    };

    for (let i = 0; i < views.length; i++) {
      switch (views[i].type){
        case 'list': assignVm(viewMeta.listModels, compileStyles(sortViewElements(views[i]))); break;
        case 'collection': assignVm(viewMeta.collectionModels, compileStyles(sortViewElements(views[i]))); break;
        case 'item': {
          let pathParts = views[i].path.split('.');
          let pathParts2 = pathParts[0].split(':');
          let wf, state;
          if (pathParts[0] === 'workflows' && pathParts.length === 3 && !navMeta.nodes[views[i].path]) {
            wf = pathParts[1];
            state = pathParts[2];
          } else if (pathParts2[0] === 'workflows' && pathParts.length === 2 && pathParts2.length === 2) {
            wf = pathParts2[1];
            state = pathParts[1];
          }
          if (wf && state) {
            let cm = _this._getMeta(views[i].className, views[i].version);
            if (cm) {
              if (wf.indexOf('@') < 0) {
                wf = wf + '@' + cm.getNamespace();
              }
              if (!viewMeta.workflowModels.hasOwnProperty(wf)) {
                viewMeta.workflowModels[wf] = {};
              }
              if (!viewMeta.workflowModels[wf].hasOwnProperty(state)) {
                viewMeta.workflowModels[wf][state] = {};
              }
              viewMeta.workflowModels[wf][state][cm.getCanonicalName()] = views[i];
            }
          } else {
            assignVm(viewMeta.itemModels, compileStyles(sortViewElements(views[i])));
          }
        } break;
        case 'create': assignVm(viewMeta.createModels, compileStyles(sortViewElements(views[i]))); break;
        case 'detail': assignVm(viewMeta.detailModels, compileStyles(sortViewElements(views[i]))); break;
        case 'masks': viewMeta.masks[views[i].name] = views[i]; break;
        case 'validators': viewMeta.validators[views[i].name] = views[i]; break;
        default: break;
      }
    }
  }

  function acceptWorkflows(workflows) {
    workflowMeta = {};

    for (let i = 0; i < workflows.length; i++) {
      let wf = workflows[i];
      let ns = formNS(wf.namespace);
      if (!workflowMeta.hasOwnProperty(ns)) {
        workflowMeta[ns] = {};
      }

      let wfClass = wf.wfClass;
      if (wfClass.indexOf('@') < 0) {
        wfClass = wfClass + '@' + wf.namespace;
      }

      try {
        let wfCm = _this._getMeta(wfClass);
        if (!workflowMeta[ns].hasOwnProperty(wfClass)) {
          workflowMeta[ns][wfClass] = {};
        }
        if (!workflowMeta[ns][wfClass].hasOwnProperty(wf.name)) {
          workflowMeta[ns][wfClass][wf.name] = [];
        }

        wf.statesByName = {};
        for (let j = 0; j < wf.states.length; j++) {
          wf.statesByName[wf.states[j].name] = wf.states[j];
          if (wf.states[j].conditions) {
            if (Array.isArray(wf.states[j].conditions)) {
              wf.states[j].conditions = conditionParser(wf.states[j].conditions, wfCm);
            }
            if (wf.states[j].conditions) {
              wf.states[j]._checker = options.calc.parseFormula(wf.states[j].conditions);
            }
          }
        }

        wf.transitionsByName = {};
        wf.transitionsBySrc = {};
        wf.transitionsByDest = {};

        for (let j = 0; j < wf.transitions.length; j++) {
          for (let k = 0; k < wf.transitions[j].assignments.length; k++) {
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

          if (wf.transitions[j].conditions) {
            if (Array.isArray(wf.transitions[j].conditions)) {
              wf.transitions[j].conditions = conditionParser(wf.transitions[j].conditions, wfCm);
            }
            if (wf.transitions[j].conditions) {
              wf.transitions[j]._checker = options.calc.parseFormula(wf.transitions[j].conditions);
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

        workflowMeta[ns][wfClass][wf.name].push(wf);
      } catch (e) {
        if (options.log) {
          options.log.warn(e);
          options.log.warn('Бизнес-процесс ' + wf.name + '@' + wf.namespace + ' не был инициализирован!');
        }
      }
    }
  }

  function acceptNavigation(navs) {
    navMeta = {
      sections: {},
      nodes: {},
      classnames: {},
      roots: {}
    };

    for (let i = 0; i < navs.length; i++) {
      let ns = formNS(navs[i].namespace);
      if (navs[i].itemType === 'section') {
        if (!navMeta.sections.hasOwnProperty(ns)) {
          navMeta.sections[ns] = {};
        }
        navMeta.sections[ns][navs[i].name] = navs[i];
        navMeta.sections[ns][navs[i].name].nodes = {};
      } else if (navs[i].itemType === 'node') {
        if (!navMeta.nodes.hasOwnProperty(ns)) {
          navMeta.nodes[ns] = {};
        }
        navMeta.nodes[ns][navs[i].code] = navs[i];
        navMeta.nodes[ns][navs[i].code].children = [];
        if (navs[i].code.indexOf('.') === -1) {
          if (!navMeta.roots.hasOwnProperty(ns)) {
            navMeta.roots[ns] = {};
          }
          navMeta.roots[ns][navs[i].code] = navMeta.nodes[ns][navs[i].code];
        }
        if (navs[i].type === 1) {
          if (!navMeta.classnames.hasOwnProperty(ns)) {
            navMeta.classnames[ns] = {};
          }
          navMeta.classnames[ns][navs[i].classname] = navs[i].code;
        }
      }
    }

    for (let ns in navMeta.nodes) {
      if (navMeta.nodes.hasOwnProperty(ns)) {
        for (let name in navMeta.nodes[ns]) {
          if (navMeta.nodes[ns].hasOwnProperty(name)) {
            let n = navMeta.nodes[ns][name];
            let sns = parseCanonicalName(n.section, true);
            let sname = sns.name;
            sns = formNS(sns.namespace || n.namespace);
            if (navMeta.sections.hasOwnProperty(sns) &&
              navMeta.sections[sns].hasOwnProperty(sname) &&
              n.code.indexOf('.') === -1) {
              navMeta.sections[sns][sname].nodes[n.code] = n;
            }

            if (n.code.indexOf('.') !== -1) {
              let p = n.code.substring(0, n.code.lastIndexOf('.'));
              if (navMeta.nodes[ns].hasOwnProperty(p)) {
                navMeta.nodes[ns][p].children.push(n);
              }
            }
          }
        }

        for (let name in navMeta.nodes[ns]) {
          if (navMeta.nodes[ns].hasOwnProperty(name)) {
            navMeta.nodes[ns][name].children.sort((a, b) => a.orderNumber - b.orderNumber);
          }
        }
      }
    }
  }

  function init() {
    return Promise.all(
        [
          ds.fetch(_this.userTypeTableName, {sort: {name: 1}}),
          ds.fetch(_this.metaTableName, {sort: {name: 1, version: 1}}),
          ds.fetch(_this.viewTableName, {sort: {type: 1, className: -1, path: -1, version: 1}}),
          ds.fetch(_this.navTableName, {sort: {itemType: -1, name: 1}}),
          ds.fetch(_this.workflowTableName, {sort: {wfClass: -1, name: 1, version: 1}})
        ]
      ).then(
        function (results) {
          try {
            acceptUserTypes(results[0]);
            acceptClassMeta(results[1]);
            acceptNavigation(results[3]);
            acceptViews(results[2]);
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
    if (sync) {
      return sync.init().then(init);
    }
    return init();
  };
}

DsMetaRepository.prototype = new MetaRepository();
module.exports = DsMetaRepository;
