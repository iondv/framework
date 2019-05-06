// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const Item = DataRepositoryModule.Item;
const PropertyTypes = require('core/PropertyTypes');
const ChangeLogger = require('core/interfaces/ChangeLogger');
const EventType = require('core/interfaces/ChangeLogger').EventType;
const uuid = require('uuid');
const EventManager = require('core/impl/EventManager');
const ctn = require('core/interfaces/DataRepository/lib/util').classTableName;
const prepareDsFilterValues = require('core/interfaces/DataRepository/lib/util').prepareDsFilter;
const dataToFilter = require('core/interfaces/DataRepository/lib/util').dataToFilter;
const formUpdatedData = require('core/interfaces/DataRepository/lib/util').formDsUpdatedData;
const filterByItemIds = require('core/interfaces/DataRepository/lib/util').filterByItemIds;
const addDiscriminatorFilter = require('core/interfaces/DataRepository/lib/util').addDiscriminatorFilter;
const loadFiles = require('core/interfaces/DataRepository/lib/util').loadFiles;
const calcProperties = require('core/interfaces/DataRepository/lib/util').calcProperties;
const castValue = require('core/interfaces/DataRepository/lib/util').castValue;
const conditionParser = require('core/ConditionParser');
const Iterator = require('core/interfaces/Iterator');
const sortingParser = require('core/SortingParser');
const IonError = require('core/IonError');
const Errors = require('core/errors/data-repo');
const MetaErrors = require('core/errors/meta-repo');
const DsErrors = require('core/errors/data-source');
const clone = require('fast-clone');
const merge = require('merge');
const Operations = require('core/FunctionCodes');
const dsF = require('core/DataSourceFunctionCodes');
const isEmpty = require('core/empty');

const EVENT_CANCELED = '____CANCELED___';

/* jshint maxstatements: 100, maxcomplexity: 100, maxdepth: 30 */
/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {MetaRepository} options.metaRepository
 * @param {KeyProvider} options.keyProvider
 * @param {Logger} [options.log]
 * @param {String} [options.namespaceSeparator]
 * @param {Number} [options.maxEagerDepth]
 * @constructor
 */
function IonDataRepository(options) {
  var _this = this;
  EventManager.apply(this);

  /**
   * @type {DataSource}
   */
  this.ds = options.dataSource;

  /**
   * @type {MetaRepository}
   */
  this.meta = options.metaRepository;

  /**
   * @type {KeyProvider}
   */
  this.keyProvider = options.keyProvider;

  /**
   * @type {ResourceStorage}
   */
  this.fileStorage = options.fileStorage;

  /**
   * @type {ImageStorage}
   */
  this.imageStorage = options.imageStorage || options.fileStorage;

  this.namespaceSeparator = options.namespaceSeparator || '_';

  this.maxEagerDepth = -(isNaN(options.maxEagerDepth) ? 3 : options.maxEagerDepth);

  function getAttrs(key, cm) {
    if (cm) {
      if (Array.isArray(key)) {
        let result = [];
        key.forEach(k => result.push(getAttrs(k, cm)));
        return result;
      }
      let attr = cm.getPropertyMeta(key);
      if (attr) {
        return attr.caption;
      }
    }
    return null;
  }

  /**
   *
   * @param {String} oper
   * @param {String} className
   * @param {String | null} [id]
   * @param {String | null} [collection]
   * @param {ClassMeta} [cm]
   * @returns {Function}
   */
  function wrapDsError(oper, className, id, collection, cm) {
    return function (err) {
      if (err instanceof IonError) {
        if (err.code === DsErrors.UNIQUENESS_VIOLATION) {
          id = id || err.params.value || JSON.stringify(err.params.values);
          if (collection) {
            return Promise.reject(
              new IonError(Errors.EXISTS_IN_COL, {info: `${className}@${id}`, col: collection}, err)
            );
          }
          let attr = getAttrs(err.params.key, cm);
          let errType = attr.length > 1 ? Errors.ITEM_EXISTS_MULTI : Errors.ITEM_EXISTS;
          return Promise.reject(
            new IonError(
              errType,
              {
                info: `${className}@${id}`,
                class: cm ? cm.getCaption() : '',
                key: err.params.key,
                attr: attr,
                value: err.params.value
              },
              err)
          );
        }
      }
      let info  = className;
      if (id) {
        info = info + '@' + id;
      }
      return Promise.reject(new IonError(Errors.FAIL, {operation: oper, info: info}, err));
    };
  }

  /**
   *
   * @param {Object[]} validators
   * @returns {Promise}
   */
  this._setValidators = function () {
    return Promise.resolve();
  };

  function tn(cm) {
    return ctn(cm, _this.namespaceSeparator);
  }

  function prepareFilterValues(cm, filter, joins) {
    return prepareDsFilterValues(cm, filter, joins, _this.ds);
  }

  /**
   * @param {String | Item} obj
   * @private
   * @returns {ClassMeta | null}
   */
  function getMeta(obj) {
    if (typeof obj === 'string') {
      return _this.meta.getMeta(obj);
    } else if (obj instanceof Item) {
      return obj.getMetaClass();
    }
    return null;
  }

  /**
   * @param {ClassMeta} cm
   * @private
   * @returns {ClassMeta}
   */
  function getRootType(cm) {
    if (cm.ancestor) {
      return getRootType(cm.ancestor);
    }
    return cm;
  }

  /**
   * @param {Object} filter
   * @param {Item} item
   * @returns {Object}
   * @private
   */
  function addFilterByItem(filter, item) {
    if (typeof item === 'object') {
      let conditions;
      conditions = [];
      if (item instanceof Item) {
        let props = item.getProperties();
        for (let nm in props) {
          if (props.hasOwnProperty(nm)) {
            let v = item.get(nm);
            if (v !== null) {
              conditions.push({[Operations.EQUAL]: ['$' + nm, v]});
            }
          }
        }
      } else {
        for (let nm in item) {
          if (item.hasOwnProperty(nm)) {
            conditions.push({[Operations.EQUAL]: ['$' + nm, item[nm]]});
          }
        }
      }
      if (conditions.length) {
        if (filter) {
          conditions.unshift(filter);
        }
        return {[Operations.AND]: conditions};
      }
    }
    return filter;
  }

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @param {{}} [options]
   * @param {User} [options.user]
   * @private
   * @returns {Item | null}
   */
  this._wrap = function (className, data, version) {
    let acm = this.meta.getMeta(className, version);
    delete data._id;
    return new Item(this.keyProvider.formKey(acm, data), data, acm);
  };

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object, skipSubClasses: Boolean}} [options]
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    options = options || {};
    let cm = getMeta(obj);
    let rcm = getRootType(cm);
    let f = clone(options.filter);
    let j = clone(options.joins || []);
    f = addFilterByItem(f, obj);
    f = addDiscriminatorFilter(f, cm, options.skipSubClasses);
    return prepareFilterValues(cm, f, j)
      .then(function (filter) {
        return _this.ds.count(tn(rcm), {filter: filter, joins: j});
      }).catch(wrapDsError('getCount', obj, ''));
  };

  /**
   * @param {ClassMeta} refc
   * @param {String} id
   * @param {{}} loaded
   */
  function checkLoaded(refc, id, loaded) {
    if (loaded.hasOwnProperty(refc.getCanonicalName() + '@' + id)) {
      return loaded[refc.getCanonicalName() + '@' + id];
    }
    let descs = refc.getDescendants();
    for (let i = 0; i < descs.length; i++) {
      let tmp = checkLoaded(descs[i], id, loaded);
      if (tmp) {
        return tmp;
      }
    }
    return false;
  }

  /**
   * @param {Item} item
   * @param {Property} property
   * @param {{}} attrs
   * @param {{}} reenrich
   * @param {{}} loaded
   */
  function prepareRefEnrichment(item, property, attrs, loaded) {
    let refc = property.meta._refClass;
    item.references = item.references || {};
    if (refc) {
      let pn = property.meta.definitionClass + '.' + property.getName();
      if (!attrs.hasOwnProperty(pn)) {
        attrs[pn] = {
          type: PropertyTypes.REFERENCE,
          refClass: refc,
          attrName: property.getName(),
          key: refc.getKeyProperties()[0],
          pIndex: 0,
          filter: [],
          reenrich: {}
        };
        if (property.meta.backRef) {
          attrs[pn].key = property.meta.backRef;
          attrs[pn].backRef = true;
        }
      }

      if (!(item.references[property.getName()] instanceof Item)) {
        let v;
        if (property.meta.backRef) {
          v = item.getItemId();
        } else {
          v = item.get(property.getName());
        }

        if (v) {
          attrs[pn].filter.push(() => {
            let ldd = null;
            if (!property.meta.backRef && (ldd = checkLoaded(refc, v, loaded))) {
              item.references[property.getName()] = ldd;
              attrs[pn].reenrich[ldd.getItemId()] = ldd;
              return null;
            }
            return v;
          });
        }
      } else {
        attrs[pn].reenrich[item.references[property.getName()].getItemId()] = item.references[property.getName()];
      }
    }
  }

  /**
   * @param {Item} item
   * @param {Property} property
   * @param {{}} attrs
   * @param {{}} reenrich
   * @param {{}} loaded
   */
  function prepareColEnrichment(item, property, attrs, loaded) {
    let refc = property.meta._refClass;
    item.collections = item.collections || {};
    if (refc) {
      let pn = property.meta.definitionClass + '.' + property.getName();
      if (!attrs.hasOwnProperty(pn)) {
        attrs[pn] = {
          type: PropertyTypes.COLLECTION,
          colClass: refc,
          attrName: property.getName(),
          backRef: property.meta.backRef,
          pIndex: 0,
          colItems: [],
          reenrich: {}
        };

        if (Array.isArray(property.meta.selSorting) && property.meta.selSorting.length) {
          attrs[pn].sort =
            sortingParser(property.meta.selSorting);
        }
      }
      if (!Array.isArray(item.collections[property.getName()])) {
        item.collections[property.getName()] = [];

        let colItems = [];

        if (property.meta.backRef && !property.meta.backColl) {
          let v = null;
          if (property.meta.binding) {
            v = item.get(property.meta.binding);
          } else {
            v = item.getItemId();
          }
          if (v !== null && colItems.indexOf(v) < 0) {
            colItems.push(v);
          }
        } else {
          let v = item.get(property.getName());
          if (Array.isArray(v)) {
            v.forEach((v) => {
              colItems.push(() => {
                if (!attrs[pn].sort) {
                  let ldd = checkLoaded(refc, v, loaded);
                  if (ldd) {
                    item.collections[property.getName()].push(ldd);
                    attrs[pn].reenrich[ldd.getItemId()] = ldd;
                    return null;
                  }
                }
                return v;
              });
            });
          }
        }

        if (property.meta.selConditions) {
          let parsed = Array.isArray(property.meta.selConditions) ?
            conditionParser(property.meta.selConditions, property.meta._refClass, item) :
            property.meta.selConditions;

          if (Array.isArray(attrs[pn].colFilter)) {
            attrs[pn].colFilter.push({filter: parsed, for: item.getItemId(), col: colItems});
          } else {
            if (attrs[pn].colFilter) {
              if (JSON.stringify(attrs[pn].colFilter) !== JSON.stringify(parsed)) {
                attrs[pn].colFilter = [
                  {filter: attrs[pn].colFilter, for: attrs[pn].prev, col: attrs[pn].colItems},
                  {filter: parsed, for: item.getItemId(), col: colItems}
                ];
                attrs[pn].colItems = [];
              } else {
                attrs[pn].colItems.push(...colItems);
              }
            } else {
              attrs[pn].colFilter = parsed;
              if (attrs[pn].prev) {
                if (Array.isArray(attrs[pn].prev)) {
                  attrs[pn].prev.push(item.getItemId());
                } else {
                  attrs[pn].prev = [attrs[pn].prev, item.getItemId()];
                }
              } else {
                attrs[pn].prev = item.getItemId();
              }
              attrs[pn].colItems.push(...colItems);
            }
          }

          if (!attrs[pn].colFilter) {
            delete attrs[pn].colFilter;
          }
        } else {
          attrs[pn].colItems.push(...colItems);
        }
      } else {
        item.collections[property.getName()].forEach((citem) => {
          attrs[pn].reenrich[citem.getItemId()] = citem;
        });
      }
    }
  }

  function formForced(param, forced, options) {
    if (param && Array.isArray(param)) {
      for (let i = 0; i < param.length; i++) {
        if (!options.needed || options.needed.hasOwnProperty(param[i][0])) {
          if (!forced.hasOwnProperty(param[i][0])) {
            forced[param[i][0]] = [];
          }
          if (param[i].length > 1) {
            forced[param[i][0]].push(param[i].slice(1));
          }
        }
      }
    }
  }

  function getEnrichList(options) {
    let {src, srcByKey, cn, sort, filter, depth, forced, implForced, loaded, attr, needed, skipCalc} = options;
    return _this._getList(cn,
      {
        sort: sort,
        filter: filter,
        nestingDepth: depth - 1,
        forceEnrichment: forced,
        ___implicitEnrichment: implForced,
        ___loaded: loaded,
        needed,
        skipCalculations: skipCalc
      }
    ).then((items) => {
      if (items && items.length) {
        if (attr.type === PropertyTypes.REFERENCE) {
          let itemsByKey = {};
          if (attr.backRef) {
            for (let i = 0; i < items.length; i++) {
              let v = items[i].get(attr.key);
              if (!itemsByKey.hasOwnProperty(v)) {
                itemsByKey[v] = [];
              }
              itemsByKey[v].push(items[i]);
            }

            for (let i = 0; i < src.length; i++) {
              if (itemsByKey.hasOwnProperty(src[i].getItemId())) {
                if (itemsByKey[src[i].getItemId()].length > 1 && options.log) {
                  options.log.warn('Обратной ссылке "' +
                    src[i].property(attr.attrName).getCaption() +
                    '" соответствует несколько объектов '
                  );
                }
                src[i].base[attr.attrName] = itemsByKey[src[i].getItemId()][0].getItemId();
                src[i].references[attr.attrName] = itemsByKey[src[i].getItemId()][0];
              }
            }
          } else {
            for (let i = 0; i < items.length; i++) {
              itemsByKey[items[i].getItemId()] = items[i];
            }

            for (let i = 0; i < src.length; i++) {
              if (itemsByKey.hasOwnProperty(src[i].base[attr.attrName])) {
                src[i].references[attr.attrName] = itemsByKey[src[i].base[attr.attrName]];
              }
            }
          }
        } else if (attr.type === PropertyTypes.COLLECTION) {
          if (attr.backRef) {
            if (!srcByKey) {
              srcByKey = {};

              for (let i = 0; i < src.length; i++) {
                srcByKey[src[i].getItemId()] = src[i];
              }
            }

            for (let i = 0; i < items.length; i++) {
              if (srcByKey.hasOwnProperty(items[i].base[attr.backRef])) {
                if (typeof srcByKey[items[i].base[attr.backRef]].collections[attr.attrName] === 'undefined') {
                  srcByKey[items[i].base[attr.backRef]].collections[attr.attrName] = [];
                }
                srcByKey[items[i].base[attr.backRef]].collections[attr.attrName].push(items[i]);
              }
            }
          } else {
            let itemsByKey = {};
            for (let i = 0; i < src.length; i++) {
              let ids = src[i].get(attr.attrName) || [];
              for (let j = 0; j < ids.length; j++) {
                if (!itemsByKey[ids[j]]) {
                  itemsByKey[ids[j]] = [];
                }
                itemsByKey[ids[j]].push(src[i]);
              }
            }
            for (let i = 0; i < items.length; i++) {
              if (itemsByKey[items[i].getItemId()]) {
                for (let j = 0; j < itemsByKey[items[i].getItemId()].length; j++) {
                  let srcItem = itemsByKey[items[i].getItemId()][j];
                  if (!srcItem.collections[attr.attrName]) {
                    srcItem.collections[attr.attrName] = [];
                  }
                  srcItem.collections[attr.attrName].push(items[i]);
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * @param {ClassMeta} cm
   */
  function descendantForced(cm, forced, options) {
    formForced(cm.getForcedEnrichment(), forced, options);
    let descs = cm.getDescendants();
    descs.forEach((d) => {
      descendantForced(d, forced, options);
    });
  }

  function eagerLoadedAttrs(cm, options, ela, explicitForced, implicitForced, nestingDepth) {
    let props = cm.getPropertyMetas();
    if (!ela.hasOwnProperty(cm.getCanonicalName())) {
      ela[cm.getCanonicalName()] = [];
    }
    let result = true;
    props.forEach((p) => {
      if (
        (
          explicitForced.hasOwnProperty(p.name) ||
          nestingDepth > 0 ||
          implicitForced.hasOwnProperty(p.name) &&
          nestingDepth >= _this.maxEagerDepth
        ) &&
        (p.type === PropertyTypes.REFERENCE || p.type === PropertyTypes.COLLECTION)
      ) {
        ela[cm.getCanonicalName()].push(p.name);
      }

      if (options.needed && options.needed.hasOwnProperty(p.name)) {
        if (p._formula) {
          result = false;
        }
      }
    });

    let descs = cm.getDescendants();
    descs.forEach((d) => {
      result = eagerLoadedAttrs(d, options, ela, explicitForced, implicitForced, nestingDepth) ? result : false;
    });
    return result;
  }

  /**
   * @param {Item[]|Item} src2
   * @param {{}} options
   * @returns {Promise}
   */
  function enrich(src2, options, cm) {
    let src = Array.isArray(src2) ? src2 : [src2];
    if (!src.length) {
      return Promise.resolve(src2);
    }
    let {nestingDepth, forceEnrichment, ___loaded, ___implicitEnrichment, needed, skipCalc} = options;
    nestingDepth = nestingDepth || 0;
    let srcByKey = {};
    let explicitForced = {};
    let implicitForced = {};
    formForced(forceEnrichment, explicitForced, {});
    formForced(___implicitEnrichment, implicitForced, options);

    descendantForced(cm, implicitForced, options);

    if (!(Object.keys(explicitForced).length || nestingDepth > 0 || Object.keys(implicitForced).length && nestingDepth >= _this.maxEagerDepth)) {
      return Promise.resolve(src2);
    }

    let needed2 = needed ? {} : null;

    let promises = Promise.resolve();
    let attrs = {};
    ___loaded = ___loaded || {};
    let ela = {};
    if (!eagerLoadedAttrs(cm, options, ela, explicitForced, implicitForced, nestingDepth)) {
      needed2 = null;
    }

    try {

      for (let i = 0; i < src.length; i++) {
        let item = src[i];
        if (item instanceof Item) {
          if (___loaded[item.getClassName() + '@' + item.getItemId()]) {
            srcByKey[item.getItemId()] = ___loaded[item.getClassName() + '@' + item.getItemId()];
            src[i] = ___loaded[item.getClassName() + '@' + item.getItemId()];
            item = src[i];
          } else {
            ___loaded[item.getClassName() + '@' + item.getItemId()] = item;
            srcByKey[item.getItemId()] = item;
          }
          item.stringValue = false;
          let props = item.getProperties();
          let eagerAttrs = ela[item.getClassName()];
          if (Array.isArray(eagerAttrs)) {
            eagerAttrs.forEach((nm) => {
              if (props[nm].getType() === PropertyTypes.REFERENCE) {
                if (typeof item.references[nm] === 'undefined') {
                  prepareRefEnrichment(item, props[nm], attrs, ___loaded);
                }
              } else if (props[nm].getType() === PropertyTypes.COLLECTION) {
                if (typeof item.collections[nm] === 'undefined') {
                  prepareColEnrichment(item, props[nm], attrs, ___loaded);
                }
              }
            });
          }
        }
      }

      Object.keys(attrs).forEach((nm) => {
        promises = promises
          .then(() => {
            let filter = null;
            let sort = null;
            let cn = null;
            if (
              attrs[nm].type === PropertyTypes.REFERENCE &&
              Array.isArray(attrs[nm].filter) &&
              attrs[nm].filter.length
            ) {
              let f = [];
              attrs[nm].filter.forEach((v) => {
                if (typeof v === 'function') {
                  v = v();
                }
                if (v && f.indexOf(v) < 0) {
                  f.push(v);
                }
              });
              if (f.length) {
                if (attrs[nm].backRef) {
                  filter = {[Operations.IN]: ['$' + attrs[nm].key, f]};
                } else {
                  filter = filterByItemIds(_this.keyProvider, attrs[nm].refClass, f);
                }
              }
              cn = attrs[nm].refClass.getCanonicalName();
            } else if (
              attrs[nm].type === PropertyTypes.COLLECTION &&
              (
                (Array.isArray(attrs[nm].colItems) && attrs[nm].colItems.length) ||
                Array.isArray(attrs[nm].colFilter)
              )
            ) {
              let f = [];
              attrs[nm].colItems.forEach((v) => {
                if (typeof v === 'function') {
                  v = v();
                }
                if (v && f.indexOf(v) < 0) {
                  f.push(v);
                }
              });

              if (f.length || Array.isArray(attrs[nm].colFilter)) {
                if (attrs[nm].backRef) {
                  filter = {[Operations.IN]: ['$' + attrs[nm].backRef, f]};
                } else {
                  filter = filterByItemIds(_this.keyProvider, attrs[nm].colClass, f);
                }
                if (attrs[nm].colFilter) {
                  if (Array.isArray(attrs[nm].colFilter)) {
                    filter = [];
                    attrs[nm].colFilter.forEach((cf) => {
                      let f2;
                      let f = [];
                      cf.col.forEach((v) => {
                        if (typeof v === 'function') {
                          v = v();
                        }
                        if (v && f.indexOf(v) < 0) {
                          f.push(v);
                        }
                      });

                      if (attrs[nm].backRef) {
                        f2 = {[Operations.IN]: ['$' + attrs[nm].backRef, f]};
                      } else {
                        f2 = filterByItemIds(_this.keyProvider, attrs[nm].colClass, f);
                      }
                      filter.push({filter: {[Operations.AND]: [f2, cf.filter]}, for: srcByKey[cf.for]});
                    });
                  } else {
                    filter = {[Operations.AND]: [filter, attrs[nm].colFilter]};
                  }
                }
                if (attrs[nm].sort) {
                  sort = attrs[nm].sort;
                }
              }
              cn = attrs[nm].colClass.getCanonicalName();
            }

            if (filter) {
              if (Array.isArray(filter)) {
                let result = Promise.resolve();
                filter.forEach((f) => {
                  result = result
                    .then(
                      () => getEnrichList({
                        src: [f.for],
                        srcByKey,
                        cn, sort,
                        filter: f.filter,
                        depth: nestingDepth,
                        forced: explicitForced[attrs[nm].attrName],
                        implForced: implicitForced[attrs[nm].attrName],
                        loaded: ___loaded,
                        attr: attrs[nm],
                        needed: needed2,
                        skipCalc
                      })
                    );
                });
              } else {
                return getEnrichList({
                  src, srcByKey,
                  cn, sort, filter,
                  depth: nestingDepth,
                  forced: explicitForced[attrs[nm].attrName],
                  implForced: implicitForced[attrs[nm].attrName],
                  loaded: ___loaded,
                  attr: attrs[nm],
                  needed: needed2,
                  skipCalc
                });
              }
            } else {
              let reenrich = Object.values(attrs[nm].reenrich);
              let fe = explicitForced[attrs[nm].attrName];

              if (reenrich.length && fe && fe.length) {
                return enrich(
                  reenrich,
                  {
                    nestingDepth: nestingDepth - 1,
                    forceEnrichment: fe,
                    ___implicitEnrichment: [],
                    ___loaded,
                    needed: needed2,
                    skipCalc
                  },
                  cm
                );
              }
            }
          });
      });
    } catch (err) {
      return Promise.reject(err);
    }

    return promises.then(() => src2);
  }

  function calcItemsProperties(items, options) {
    let calcs = Promise.resolve();
    items.forEach((item) => {
      calcs = calcs.then(() => item.calculateProperties(options.needed));
    });
    return calcs.then(() => items);
  }

  /**
   * @param {String | Item} obj
   * @param {Object} [options]
   * @param {Object} [options.filter]
   * @param {Object} [options.joins]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {{}} [options.___loaded]
   * @param {{}} [options.needed]
   * @param {Boolean} [options.skipSubClasses]
   * @returns {Promise}
   */
  this._getList = function (obj, options) {
    options = options || {};
    let $options = {
      sort: options.sort,
      offset: options.offset,
      count: options.count,
      countTotal: options.countTotal,
      distinct: options.distinct,
      joins: options.joins
    };

    const cm = getMeta(obj);
    const rcm = getRootType(cm);
    $options.fields = {_class: '$_class', _classVer: '$_classVer'};
    const props = cm.getPropertyMetas();
    for (let i = 0; i < props.length; i++) {
      $options.fields[props[i].name] = '$' + props[i].name;
    }
    $options.filter = addFilterByItem(options.filter, obj);
    $options.filter = addDiscriminatorFilter($options.filter, cm, options.skipSubClasses);
    $options.joins = options.joins || [];

    return bubble(
      'pre-fetch',
      cm,
      {
        options: $options
      })
      .then(() => prepareFilterValues(cm, $options.filter, $options.joins))
      .then((filter) => {
        $options.filter = filter;
        return _this.ds.fetch(tn(rcm), $options);
      })
      .catch(wrapDsError('getList', obj))
      .then((data) => {
        let result = [];
        let fl = Promise.resolve();
        data.forEach((d) => {
          let wd = _this._wrap(d._class, d, d._classVer);
          result.push(wd);
          fl = fl.then(() => loadFiles(wd, _this.fileStorage, _this.imageStorage));
        });

        if (typeof data.total !== 'undefined' && data.total !== null) {
          result.total = data.total;
        }
        return fl.then(() => result);
      })
      .then(result => enrich(result, merge(options, {skipCalc: true}), cm))
      .then(result => options.skipCalculations ? result : calcItemsProperties(result, options));
  };

  function ItemIterator(iterator, options) {
    this._next = function () {
      iterator.next().then((data) => {
        if (data) {
          let item = _this._wrap(data._class, data, data._classVer);
          return loadFiles(item, _this.fileStorage, _this.imageStorage)
            .then(item => enrich(item, merge(options, {skipCalc: true}), item.getMetaClass()))
            .then(item => options.skipCalculations ? item : calcItemsProperties([item], options).then(() => item));
        }
        return Promise.resolve(null);
      });
    };

    this._count = function () {
      return iterator.count();
    };
  }

  ItemIterator.prototype = new Iterator();

  /**
   * @param {String | Item} obj
   * @param {Object} [options]
   * @param {Object} [options.filter]
   * @param {Object} [options.joins]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipCalculations]
   * @param {Boolean} [options.skipSubClasses]
   * @param {{}} [options.___loaded]
   * @returns {Promise}
   */
  this._getIterator = function (obj, options) {
    options = options || {};
    let opts = {
      sort: options.sort,
      offset: options.offset,
      count: options.count,
      countTotal: options.countTotal,
      distinct: options.distinct,
      joins: options.joins
    };
    let cm = getMeta(obj);
    let rcm = getRootType(cm);
    opts.fields = {_class: '$_class', _classVer: '$_classVer'};
    let props = cm.getPropertyMetas();
    for (let i = 0; i < props.length; i++) {
      opts.fields[props[i].name] = '$' + props[i].name;
    }
    opts.filter = addFilterByItem(options.filter, obj);
    opts.filter = addDiscriminatorFilter(opts.filter, cm, options.skipSubClasses);
    opts.joins = opts.joins || [];
    return bubble(
      'pre-iterate',
      cm,
      {
        options: opts
      }).then(() => prepareFilterValues(cm, opts.filter, opts.joins)).
    then(function (filter) {
      opts.filter = filter;
      return _this.ds.iterator(tn(rcm), opts);
    }).
    catch(wrapDsError('getIterator', obj)).
    then(function (iter) {
      return Promise.resolve(new ItemIterator(iter, opts));
    });
  };

  /**
   * @param {ClassMeta} cm
   * @param {String} attr
   * @param {Array | {}} parent
   * @param {String} path
   * @param {{}} joinsHash
   * @returns {String | {}}
   */
  function parseAttr(cm, attr, parent, path, joinsHash) {
    if (cm) {
      if (attr[0] === '$') {
        let cntxt = '';
        if (typeof parent === 'object' && !Array.isArray(parent)) {
          cntxt = parent.alias + '.';
        }

        let tmp = attr.substr(1);
        let pt = attr.indexOf('.');
        let pm;
        if (pt > 0) {
          tmp = attr.substr(1, pt - 1);
        }
        if ((pm = cm.getPropertyMeta(tmp)) !== null) {
          if (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION) {
            let rc = pm._refClass;
            if (pt > 0) {
              let jpth = (path ? path + '|' : '') + pm.name;
              let join;
              if (joinsHash.hasOwnProperty(jpth)) {
                join = joinsHash[jpth];
              } else {
                joinsHash.zi$$$$counter++;
                let alias = '___join' + joinsHash.zi$$$$counter;
                join = {
                  table: tn(rc),
                  alias: alias,
                  left: cntxt + (pm.backRef ? cm.getKeyProperties()[0] : pm.name),
                  right: pm.backRef ? pm.backRef : rc.getKeyProperties()[0],
                  many: pm.type === PropertyTypes.COLLECTION && !pm.backRef//,
                  //filter: addDiscriminatorFilter(null, rc) @TODO Вернуть когда уйдем с монги
                };
                joinsHash[jpth] = join;

                if (Array.isArray(parent)) {
                  parent.push(join);
                } else if (typeof parent === 'object') {
                  if (!Array.isArray(parent.join)) {
                    parent.join = [];
                  }
                  parent.join.push(join);
                }
              }
              return parseAttr(
                rc,
                '$' + attr.substr(pt + 1),
                join,
                jpth,
                joinsHash
              );
            }
            return {[dsF.JOIN_EXISTS]: [
              tn(rc),
              cntxt + (pm.backRef ? cm.getKeyProperties()[0] : pm.name),
              pm.backRef ? pm.backRef : rc.getKeyProperties()[0],
              null,
              pm.type === PropertyTypes.COLLECTION && !pm.backRef
            ]};
          }
          return '$' + cntxt + attr.substr(1);
        } else {
          throw new IonError(MetaErrors.NO_ATTR, {class: cm.getCaption(), attr: tmp});
        }
      }
    }
    return attr;
  }

  /**
   * @param {{}} result
   * @param {String} nm
   * @param {ClassMeta} cm
   * @param {Array} joins
   * @param {{}} joinsHash
   */
  function toDsSize(result, nm, cm, joins, joinsHash) {
    let parsed = parseAttr(cm, nm, joins, '', joinsHash);
    if (typeof parsed === 'object' && parsed) {
      result[dsF.JOIN_SIZE] = parsed[dsF.JOIN_EXISTS];
    } else {
      result[Operations.SIZE] = [parsed];
    }
  }

  function funcToDsExpr(expr, cm, joins, joinsHash) {
    let result;
    if (Array.isArray(expr)) {
      result = [];
      expr.forEach(function (e) {
        result.push(funcToDsExpr(e, cm, joins, joinsHash));
      });
      return result;
    }

    if (typeof expr === 'string') {
      return parseAttr(cm, expr, joins, '', joinsHash);
    }

    if (typeof expr === 'object' && !(expr instanceof Date) && expr) {
      result = {};
      for (let nm in expr) {
        if (expr.hasOwnProperty(nm)) {
          if (nm === Operations.SIZE) {
            toDsSize(result, expr[nm][0], cm, joins, joinsHash);
          } else {
            result[nm] = funcToDsExpr(expr[nm], cm, joins, joinsHash);
          }
        }
      }
      return result;
    }
    return expr;
  }

  function prepareResults(cm, opts, joins) {
    let joinsHash = {zi$$$$counter: 0};
    if (opts.aggregates) {
      for (let nm in opts.aggregates) {
        if (opts.aggregates.hasOwnProperty(nm)) {
          opts.aggregates[nm] = funcToDsExpr(opts.aggregates[nm], cm, joins, joinsHash);
        }
      }
    }
    if (opts.fields) {
      for (let nm in opts.fields) {
        if (opts.fields.hasOwnProperty(nm)) {
          if (typeof opts.fields[nm] === 'object' && opts.fields[nm]) {
            opts.fields[nm] = funcToDsExpr(opts.fields[nm], cm, joins, joinsHash);
          } else if (typeof opts.fields[nm] === 'string') {
            opts.fields[nm] = parseAttr(cm, opts.fields[nm], joins, '', joinsHash);
          }
        }
      }
    }
  }

  /**
   * @param {String} className
   * @param {{}} [options]
   * @param {{}} [options.joins]
   * @param {{}} [options.expressions]
   * @param {{}} [options.filter]
   * @param {{}} [options.groupBy]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.skipSubClasses]
   * @returns {Promise}
   */
  this._aggregate = function (className, options) {
    options = options || {};
    let opts = {
      expressions: options.expressions,
      fields: options.fields,
      aggregates: options.aggregates,
      joins: options.joins,
      groupBy: options.groupBy,
      offset: options.offset,
      count: options.count,
      sort: options.sort,
      distinct: options.distinct,
      to: options.to,
      append: options.append
    };
    let cm = getMeta(className);
    let rcm = getRootType(cm);
    opts.joins = opts.joins || [];
    prepareResults(cm, opts, opts.joins);
    opts.filter = addDiscriminatorFilter(options.filter, cm, options.skipSubClasses);
    return prepareFilterValues(cm, opts.filter, opts.joins)
      .then((filter) => {
        opts.filter = filter;
        return _this.ds.aggregate(tn(rcm), opts);
      })
      .catch(wrapDsError('aggregate', className));
  };

  /**
   * @param {String} className
   * @param {Object} options
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {String[]} [options.attributes]
   * @param {String[]} [options.select]
   * @param {Boolean} [options.distinct]
   * @param {Boolean} [options.skipSubClasses]
   * @returns {Promise}
   */
  this._rawData = function (className, options) {
    options = options || {};
    let opts = {
      sort: options.sort,
      offset: options.offset,
      count: options.count,
      countTotal: options.countTotal,
      distinct: options.distinct
    };
    let cm = getMeta(className);
    let rcm = getRootType(cm);
    opts.fields = {_class: '$_class', _classVer: '$_classVer'};
    let props = cm.getPropertyMetas();
    for (let i = 0; i < props.length; i++) {
      options.fields[props[i].name] = '$' + props[i].name;
    }
    opts.filter = addDiscriminatorFilter(opts.filter, cm, options.skipSubClasses);
    opts.joins = [];
    return prepareFilterValues(cm, opts.filter, opts.joins)
      .then(function (filter) {
        opts.filter = filter;
        return _this.ds.fetch(tn(rcm), opts);
      }).catch(wrapDsError('rawData', className));
  };

  /**
   *
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{}} options
   * @param {User} options.user
   * @param {Number} [options.nestingDepth]
   * @param {{}} [options.filter]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipEnrich]
   * @param {Boolean} [options.skipCalculations]
   * @param {{}} [options.needed]
   * @param {Boolean} [options.skipAutoAssign]
   * @param {Boolean} [options.reload]
   */
  this._getItem = function (obj, id, options) {
    let cm = obj instanceof Item ? obj.getMetaClass() : getMeta(obj);
    let rcm = getRootType(cm);
    options = options || {};
    let opts = {};
    opts.fields = {_class: '$_class', _classVer: '$_classVer'};
    let props = cm.getPropertyMetas();
    for (let i = 0; i < props.length; i++) {
      opts.fields[props[i].name] = '$' + props[i].name;
    }

    let fetcher;

    if (id && typeof obj === 'string') {
      let conditions = formUpdatedData(cm, _this.keyProvider.keyToData(cm, id));
      if (conditions  === null) {
        return Promise.resolve(null);
      }
      conditions = dataToFilter(conditions);
      let j = [];

      let fp = null;
      if (opts.filter) {
        fp = prepareFilterValues(cm, opts.filter, j)
          .then((filter) => {
            if (j.length) {
              opts.joins = j;
            }
            return {and: [conditions, filter]};
          });
      } else {
        fp = Promise.resolve(conditions);
      }

      fetcher = fp
        .then(f => _this.ds.get(tn(rcm), f, opts))
        .then((data) => {
          if (data) {
            let item = _this._wrap(data._class, data, data._classVer);
            return loadFiles(item, _this.fileStorage, _this.imageStorage);
          }
          return Promise.resolve(null);
        });
    } else if (obj instanceof Item) {
      if (options.reload) {
        if (obj.getItemId()) {
          return this._getItem(obj.getClassName(), obj.getItemId(), options);
        } else {
          opts.filter = addFilterByItem({}, obj);
          opts.filter = addDiscriminatorFilter(opts.filter, cm);
          opts.count = 1;
          opts.joins = [];
          fetcher = prepareFilterValues(cm, opts.filter, opts.joins)
            .then((filter) => {
              opts.filter = filter;
              return _this.ds.fetch(tn(rcm), opts);
            })
            .then((data) => {
              for (let i = 0; i < data.length; i++) {
                let item = _this._wrap(data[i]._class, data[i], data[i]._classVer);
                return loadFiles(item, _this.fileStorage, _this.imageStorage);
              }
              return Promise.resolve(null);
            });
        }
      } else {
        if (options.skipAutoAssign) {
          fetcher = Promise.resolve(obj);
        } else {
          fetcher = autoAssign(cm, obj.base, true, options.user).then(() => obj);
        }
      }
    } else {
      throw new IonError(Errors.BAD_PARAMS, {method: 'getItem'});
    }
    return fetcher
      .catch(wrapDsError('getItem', cm.getCanonicalName(), id || obj.getItemId()))
      .then(item => (options.skipEnrich || !item) ? item : enrich(item, merge(options, {skipCalc: true}), item.getMetaClass()))
      .then(item => (options.skipCalculations || !item) ? item : item.calculateProperties(options.needed));
  };

  function fileSaver(updates, id, cm, pm) {
    if (Array.isArray(updates[pm.name])) {
      let savers = [];
      for (let i = 0; i < updates[pm.name].length; i++) {
        if (typeof updates[pm.name][i] !== 'string') {
          savers.push(_this.fileStorage.accept(updates[pm.name][i]));
        }
      }
      if (savers.length) {
        return Promise.all(savers).then(
          function (files) {
            if (Array.isArray(files)) {
              updates[pm.name] = [];
              for (let i = 0; i < files.length; i++) {
                updates[pm.name].push(files[i].id);
              }
            }
            return Promise.resolve();
          }
        );
      } else {
        return Promise.resolve();
      }
    } else {
      let storage = _this.fileStorage;
      if (pm.type === PropertyTypes.IMAGE) {
        storage = _this.imageStorage;
      }
      return storage.accept(updates[pm.name]).then(function (f) {
        updates[pm.name] = f.id;
        return Promise.resolve();
      }).catch((err) => {
        throw new IonError(
          Errors.FILE_ATTR_SAVE,
          {
            attr: pm.caption,
            info: `${cm.getCanonicalName()}@${id}`
          },
          err);
      });
    }
  }

  /**
   * @param {ClassMeta} cm
   * @param {{}} data
   */
  function checkRequired(cm, data, lazy, warn) {
    let props = cm.getPropertyMetas();
    let invalidAttrs = [];
    let result = Promise.resolve();
    for (let i = 0; i < props.length; i++) {
      if (
        props[i].type === PropertyTypes.REFERENCE &&
        Array.isArray(props[i].allowedSubclasses) &&
        props[i].allowedSubclasses.length &&
        data.hasOwnProperty(props[i].name) &&
        data[props[i].name]
      ) {
        result = result
          .then(() => _this._getItem(props[i]._refClass.getCanonicalName(), data[props[i].name], {needed: {}}))
          .then((check) => {
            if (!isSubclassAllowed(cm, props[i].allowedSubclasses, check.getMetaClass())) {
              throw new Error(`Обьекты класса "${check.getMetaClass().getCaption()}" недопустимы в ссылке "${cm.getCaption()}.${props[i].caption}".`);
            }
          });
      }

      if (
        props[i].type !== PropertyTypes.COLLECTION &&
        props[i].name !== '__class' &&
        props[i].name !== '__classTitle' &&
        !props[i].nullable && (
          lazy && data.hasOwnProperty(props[i].name) && data[props[i].name] === null ||
          !lazy && !props[i].autoassigned && (!data.hasOwnProperty(props[i].name) || data[props[i].name] === null)
        )) {
        invalidAttrs.push(cm.getCaption() + '.' + props[i].caption);
      }
    }
    if (invalidAttrs.length) {
      let err = new IonError(Errors.MISSING_REQUIRED, {info: invalidAttrs.join(', ')});
      if (!warn) {
        throw err;
      }
      if (options.log) {
        options.log.warn('Ошибка контроля целостности сохраняемого объекта', err.message);
      }
    }
    return result;
  }

  /**
   * @param {ClassMeta} cm
   * @param {{}} updates
   * @param {Boolean} onlyDefaults
   * @param {String} uid
   */
  function autoAssign(cm, updates, onlyDefaults, user) {
    if (cm.getCreationTracker() && !updates[cm.getCreationTracker()]) {
      let pm = cm.getPropertyMeta(cm.getCreationTracker());
      updates[cm.getCreationTracker()] = castValue(new Date(), pm);

    }

    if (cm.getChangeTracker() && !updates[cm.getChangeTracker()]) {
      let pm = cm.getPropertyMeta(cm.getChangeTracker());
      updates[cm.getChangeTracker()] = castValue(new Date(), pm);

    }

    let properties = cm.getPropertyMetas();
    let keys = cm.getKeyProperties();
    let calcs = Promise.resolve(updates);

    let calcContext = {
      $context: _this._wrap(cm.getCanonicalName(), updates),
      $uid: user ? user.id() : null
    };

    let props = {};
    if (user) {
      props = user.properties();
      for (let p in props) {
        if (props.hasOwnProperty(p)) {
          calcContext['$' + p] = props[p];
        }
      }
    }

    properties.forEach((pm) => {
      if (typeof updates[pm.name] === 'undefined') {
        if (pm.type === PropertyTypes.COLLECTION && !pm.backRef) {
          updates[pm.name] = [];
          return;
        }

        if (pm.autoassigned && (pm.defaultValue === null || pm.defaultValue === '') && !onlyDefaults) {
          switch (pm.type) {
            case PropertyTypes.STRING:
            case PropertyTypes.GUID:
              updates[pm.name] = uuid.v1();
              break;
            case PropertyTypes.DATETIME:
              updates[pm.name] = castValue(new Date(), pm);
              break;
            case PropertyTypes.INT:
              delete updates[pm.name];
              break;
            default:

          }
        } else if (pm.defaultValue !== null && pm.defaultValue !== '') {
          let v = pm.defaultValue;
          if (typeof v === 'string' && v.length > 1 && v[0] === '$') {
            if (calcContext.hasOwnProperty(v.substr(1))) {
              updates[pm.name] = calcContext[v.substr(1)];
            }
          } else if (pm._dvFormula) {
            if (!pm.autoassigned || !onlyDefaults) {
              calcs = calcs
                .then(() => pm._dvFormula.apply(calcContext))
                .then((result) => {
                  updates[pm.name] = castValue(result instanceof Item ? result.getItemId() : result, pm.type);
                  return updates;
                });
            }
          } else {
            updates[pm.name] = castValue(v, pm.type);
          }
        } else if (keys.indexOf(pm.name) >= 0 && !onlyDefaults) {
          throw new IonError(Errors.NO_KEY_SPEC, {info: cm.getCaption() + '.' + pm.caption});
        }
      }
    });

    return calcs;
  }

  function prepareFileSavers(id, cm, fileSavers, updates) {
    let properties = cm.getPropertyMetas();
    for (let i = 0;  i < properties.length; i++) {
      let pm = properties[i];

      if (updates.hasOwnProperty(pm.name) && updates[pm.name] &&
        (
          (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) &&
          typeof updates[pm.name] !== 'string' && !Array.isArray(updates[pm.name]) ||
          pm.type === PropertyTypes.FILE_LIST && Array.isArray(updates[pm.name])
        )
      ) {
        fileSavers.push(fileSaver(updates, id, cm, pm));
      }
    }
  }

  /**
   * @param {String} itemId
   * @param {{}} pm
   * @param {{}} updates
   * @param {ClassMeta} cm
   * @param {String} oldId
   * @returns {Promise}
   */
  function backRefUpdater(itemId, pm, updates, cm, oldId) {
    let rcm = pm._refClass;
    let rpm = rcm.getPropertyMeta(pm.backRef);

    if (!rpm) {
      return Promise.reject(new IonError(Errors.NO_BACK_REF,
        {
          backRef: cm.getCaption() + '.' + pm.caption,
          backAttr: rcm.getCaption() + '.' + pm.backRef
        }
      ));
    }

    let clr = {};
    let ups = {};
    let conds = {[Operations.EQUAL]: ['$' + rcm.getKeyProperties()[0], updates[pm.name]]};

    let clrf = {[Operations.AND]: [
      {[Operations.EQUAL]: ['$' + pm.backRef, oldId || itemId]},
      {[Operations.NOT_EQUAL]: ['$' + rcm.getKeyProperties()[0], updates[pm.name]]}
    ]};

    clr[pm.backRef] = null;
    ups[pm.backRef] = itemId;

    /**
     * @param {ClassMeta} rcm
     * @param {{}} conds
     * @param {{}} ups
     * @returns {Promise.<TResult>}
     */
    function setBrLink(rcm, conds, ups) {
      return _this._getItem(
        rcm.getCanonicalName(),
        String(updates[pm.name]),
        {forcedEnrichment: [[pm.backRef]], skipCalculations: true}
      )
        .then((bro) => {
          let lost = bro.property(pm.backRef).evaluate();
          if (lost) {
            if (options.log) {
              options.log.warn('Объект "' + bro.getClassName() + '@' + bro.getItemId +
                '" был отвязан от "' + lost.getClassName() + '@' + lost.getItemId() + '".');
            }
          }
          return options.dataSource.update(tn(rcm), conds, ups);
        });
    }

    if (oldId) {
      let p;
      if (!rpm.nullable) {
        p = options.dataSource.get(tn(rcm), clrf).then((bri) => {
          if (bri) {
            if (options.log) {
              options.log.warn('Предыдущий объект по ссылке "' + cm.getCaption() + '.' + pm.caption +
                '" не может быть отвязан. Обратная ссылка не была присвоена.');
            }
            return Promise.reject('_NOT_UNLINKED_');
          }
          return Promise.resolve();
        });
      } else {
        p = Promise.resolve();
      }
      return p.then(function () {
        if (!updates[pm.name]) {
          return options.dataSource.update(tn(rcm), clrf, clr);
        }
        return options.dataSource.update(tn(rcm), clrf, clr).then(() => setBrLink(rcm, conds, ups));
      }).catch(function (err) {
        return err === '_NOT_UNLINKED_' ? Promise.resolve() : Promise.reject(err);
      });
    }

    if (!updates[pm.name]) {
      return Promise.resolve();
    }
    return setBrLink(rcm, conds, ups);
  }

  /**
   * @param {Item} item
   * @param {ClassMeta} cm
   * @param {{}} updates
   * @param {String} oldId
   */
  function updateBackRefs(item, cm, updates, oldId) {
    let properties = cm.getPropertyMetas();
    let workers = Promise.resolve();
    properties.forEach((pm) => {
      if (
        updates.hasOwnProperty(pm.name) &&
        pm.type === PropertyTypes.REFERENCE &&
        pm.backRef
      ) {
        workers = workers.then(() => backRefUpdater(pm.binding ? item.get(pm.binding) : item.getItemId(), pm, updates, cm, oldId));
      }
    });
    return workers.then(() => item);
  }

  /**
   * @param {ChangeLogger | Function} changeLogger
   * @param {{}} record
   * @param {String} record.type
   * @param {Item} [record.item]
   * @param {ClassMeta} [record.cm]
   * @param {{}} [record.updates]
   * @returns {Promise}
   */
  function logChanges(changeLogger, record) {
    let cm = record.cm || record.item.getMetaClass();
    if (cm.isJournaling()) {
      let p;
      if (changeLogger instanceof ChangeLogger) {
        let base = {};
        if (record.base) {
          base = clone(record.base);
          delete base._id;
          delete base._class;
          delete base._classVer;
        }
        p = changeLogger.logChange(
          record.type,
          {
            name: record.item.getMetaClass().getCanonicalName(),
            version: record.item.getMetaClass().getVersion()
          },
          record.item.getItemId(),
          record.updates,
          base
        );
      } else if (typeof changeLogger === 'function') {
        p = changeLogger(record);
      }

      if (p instanceof Promise) {
        return p.then(function () {
          return Promise.resolve(record.item);
        });
      }
    }
    return Promise.resolve(record.item);
  }

  function saveBackrefItem(meta, id, updates, changeLogger) {
    return function () {
      return _this._saveItem(meta.getCanonicalName(), id, updates, meta.getVersion(), changeLogger);
    };
  }

  /**
   * @param {ClassMeta} meta
   * @param {String} backRef
   * @param {String} id
   * @param {{}} updates
   * @param {ChangeLogger} changeLogger
     * @returns {Function}
     */
  function fetchNSaveBackRefs(meta, backRef, id, updates, changeLogger) {
    return function () {
      return _this._getList(meta.getCanonicalName(), {filter: {[Operations.EQUAL]: ['$' + backRef, id]}})
        .then(function (found) {
          let saver = null;
          if (found.length) {
            for (let i = 0; i < found.length; i++) {
              if (found[i] instanceof Item) {
                if (saver) {
                  saver = saver.then(saveBackrefItem(meta, found[i].getItemId(), updates, changeLogger));
                } else {
                  saver = saveBackrefItem(meta, found[i].getItemId(), updates, changeLogger)();
                }
              }
            }
          } else {
            saver = saveBackrefItem(meta, null, updates, changeLogger)();
          }
          if (!saver) {
            return Promise.resolve();
          }
          return saver;
        });
    };
  }

  function saveDirectRefItem(nm, meta, id, updates, changeLogger, needSetRef) {
    return function () {
      return _this._saveItem(meta.getCanonicalName(), id, updates, meta.getVersion(), changeLogger)
        .then((item) => {
          if (needSetRef && (!id || id !== item.getItemId())) {
            needSetRef[nm] = item.getItemId();
          }
          return Promise.resolve(item);
        });
    };
  }

  /**
   * @param {Item} item
   * @param {{}} refUpdates
   */
  function refUpdator(item, refUpdates, changeLogger) {
    if (!item) {
      return Promise.resolve();
    }
    let saver = null;
    let needSetRef = {};
    for (let nm in refUpdates) {
      if (refUpdates.hasOwnProperty(nm)) {
        let p = item.property(nm);
        if (p && p.meta._refClass) {
          let rm = p.meta._refClass;
          if (p.meta.backRef) {
            if (p.meta.eagerLoading) {
              let refItems = item.property(nm).evaluate();
              if (Array.isArray(refItems) && refItems.length) {
                for (let i = 0; i < refItems.length; i++) {
                  if (refItems[i] instanceof Item) {
                    saver = saver ?
                      saver.then(saveBackrefItem(rm, refItems[i].getItemId(), refUpdates[nm], changeLogger)) :
                      saveBackrefItem(rm, refItems[i].getItemId(), refUpdates[nm], changeLogger)();
                  }
                }
              } else if (refItems instanceof Item) {
                saver = saver ?
                  saver.then(saveBackrefItem(rm, refItems.getItemId(), refUpdates[nm], changeLogger)) :
                  saveBackrefItem(rm, refItems.getItemId(), refUpdates[nm], changeLogger)();
              } else {
                saver = saver ?
                  saver.then(saveBackrefItem(rm, null, refUpdates[nm], changeLogger)) :
                  saveBackrefItem(rm, null, refUpdates[nm], changeLogger)();
              }
            } else {
              saver = saver ?
                saver.then(fetchNSaveBackRefs(rm, p.meta.backRef, item.getItemId(), refUpdates[nm], changeLogger)) :
                fetchNSaveBackRefs(rm, p.meta.backRef, item.getItemId(), refUpdates[nm], changeLogger)();
            }
          } else {
            saver = saver ?
              saver.then(saveDirectRefItem(nm, rm, item.get(nm), refUpdates[nm], changeLogger, needSetRef)) :
              saveDirectRefItem(nm, rm, item.get(nm), refUpdates[nm], changeLogger, needSetRef)();
          }
        }
      }
    }
    if (!saver) {
      return Promise.resolve(item);
    }

    return saver.then(function () {
      for (let nm in needSetRef) {
        if (needSetRef.hasOwnProperty(nm)) {
          return _this._editItem(
            item.getMetaClass().getCanonicalName(),
            item.getItemId(),
            needSetRef,
            changeLogger
          );
        }
      }
      return Promise.resolve(item);
    });
  }

  function cloneEventData(data, depth) {
    depth  = depth || 10;
    if (depth < 0) {
      return undefined;
    }
    if (Array.isArray(data)) {
      let arr = [];
      for (let i = 0; i < data.length; i++) {
        arr.push(cloneEventData(data[i], depth - 1));
      }
      return arr;
    } else if (data && typeof data === 'object' && data.constructor === Object) {
      let result = {};
      for (let nm in data) {
        if (data.hasOwnProperty(nm)) {
          result[nm] = cloneEventData(data[nm], depth - 1);
        }
      }
      return result;
    }
    return data;
  }

  function trgr(c, eventType, data) {
    return function (e) {
      let bd = cloneEventData(data);
      bd.type = c.getCanonicalName() + '.' + eventType;
      bd.origin = e;
      return _this.trigger(bd)
        .then((e2) => {
          if (e && Array.isArray(e.results)) {
            e2.results = e.results.concat(Array.isArray(e2.results) ? e2.results : []);
          }
          return e2;
        });
    };
  }

  /**
   * @param {String} eventType
   * @param {ClassMeta} cm
   * @param {{}} data
   * @returns {Promise}
   */
  function bubble(eventType, cm, data) {
    let c = cm;
    let p = Promise.resolve();
    while (c) {
      p = p.then(trgr(c, eventType, data));
      c = c.getAncestor();
    }
    return p;
  }

  function preWriteEventHandler(updates) {
    return function (e) {
      if (e) {
        if (Array.isArray(e.results) && e.results.length) {
          for (let i = 0; i < e.results.length; i++) {
            for (let nm in e.results[i]) {
              if (e.results[i].hasOwnProperty(nm)) {
                updates[nm] = e.results[i][nm];
              }
            }
          }
        }
      }
      return Promise.resolve(updates);
    };
  }

  function writeEventHandler(changeLogger, options) {
    return function (e) {
      if (!e || options.skipResult) {
        return Promise.resolve();
      }
      let up = false;
      let data = {};
      if (Array.isArray(e.results) && e.results.length) {
        for (let i = 0; i < e.results.length; i++) {
          for (let nm in e.results[i]) {
            if (e.results[i].hasOwnProperty(nm)) {
              up = true;
              data[nm] = e.results[i][nm];
            }
          }
        }
      }
      if (up) {
        return _this._editItem(
          e.item.getMetaClass().getCanonicalName(),
          e.item.getItemId(),
          data,
          changeLogger,
          options,
          true
        );
      }
      return enrich(e.item, options, e.item.getMetaClass());
    };
  }

  /**
   * @param {Item} item
   * @param {{}} [conditions]
   * @param {{}} [options]
   * @param {Boolean} [options.skipCacheRefresh]
   * @param {Boolean} [options.skipCacheDependencies]
   */
  function refreshCaches(item, conditions, options) {
    if (options && options.skipCacheRefresh) {
      return Promise.resolve(item);
    }
    if (Array.isArray(item)) {
      let p = Promise.resolve();
      item.forEach((item) => {
        p = p.then(() => refreshCaches(item, conditions, options));
      });
      return p;
    }
    if (item instanceof Item) {
      let props = item.getMetaClass().getPropertyMetas();
      let needed = {};
      props.forEach((p) => {
        if (p.cached) {
          needed[p.name] = true;
        }
      });
      let updates = {};

      let eager = [];
      if (item.getMetaClass().isSemanticCached()) {
        eager.push(...item.getMetaClass().getForcedEnrichment());
      }

      let cd = [];
      if (!options || !options.skipCacheDependencies) {
        cd.push(...item.getMetaClass().getCacheDependencies());
        eager.push(...cd);
      }

      let p = eager.length ?
        _this._getItem(item, null, {forceEnrichment: eager, skipAutoAssign: true}) :
        Promise.resolve(item);

      return p.then(item => calcProperties(item, false, needed, true))
        .then((item) => {
          let rcm = getRootType(item.getMetaClass());
          if (!conditions) {
            conditions = formUpdatedData(rcm, _this.keyProvider.keyToData(rcm, item.getItemId()));
            conditions = dataToFilter(conditions);
          }
          Object.keys(needed).forEach((a) => {
            updates[a] = item.get(a);
          });
          if (item.getMetaClass().isSemanticCached()) {
            updates.__semantic = item.getMetaClass().getSemantics(item);
          }
          return _this.ds.update(
            tn(rcm),
            conditions,
            updates,
            {skipResult: true}
          ).then(() => item);
        })
        .then((item) => {
          let p = Promise.resolve();
          cd.forEach((a) => {
            let dep = item.property(a.join('.')).evaluate();
            if (dep) {
              p = p.then(() => refreshCaches(dep));
            }
          });
          return p.then(() => item);
        });
    }
    return Promise.resolve(item);
  }

  /**
   *
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger | Function} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.ignoreIntegrityCheck]
   * @param {User} [options.user]
   * @param {Boolean} [options.skipCacheRefresh]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, options) {
    options = options || {};
    try {
      let cm = _this.meta.getMeta(classname, version);
      if (cm.isAbstract()) {
        throw new Error('Обьект абстрактного класса не может быть создан!');
      }
      let rcm = getRootType(cm);

      let refUpdates = {};
      let da = {};
      let updates;

      return bubble(
        'pre-create',
        cm,
        {
          data: data,
          user: options.user
        })
        .then(preWriteEventHandler(data))
        .then(() => {
          updates = formUpdatedData(cm, data, true, refUpdates, da) || {};
          return autoAssign(cm, updates, false, options.user);
        })
        .then(() => checkRequired(cm, updates, false, options.ignoreIntegrityCheck))
        .then(() => {
          let fileSavers = [];
          prepareFileSavers('new', cm, fileSavers, updates);
          return Promise.all(fileSavers);
        })
        .then(function () {
          updates._class = cm.getCanonicalName();
          updates._classVer = cm.getVersion();
          if (options.user) {
            let creatorAttr = '_creator';
            if (cm.getCreatorTracker()) {
              creatorAttr = cm.getCreatorTracker();
            }
            updates[creatorAttr] = options.user.id();
          }

          return _this.ds.insert(
            tn(rcm),
            updates,
            {
              skipResult: options.skipResult && !(da.refUpdates || da.backRefUpdates),
              adjustAutoInc: options.adjustAutoInc
            }
          );
        })
        .catch(wrapDsError('createItem', classname, null, null, cm))
        .then((data) => {
          if (!data) {
            if (options.skipResult && !(da.refUpdates || da.backRefUpdates)) {
              return Promise.resolve();
            } else {
              throw new Error('Объект не был найден после создания.');
            }
          }
          let item = _this._wrap(data._class, data, data._classVer);
          delete updates._class;
          delete updates._classVer;
          if (updates._creator) {
            delete updates._creator;
          }
          return logChanges(changeLogger, {type: EventType.CREATE, item: item, updates: updates});
        })
        .then(item => updateBackRefs(item, cm, data))
        .then(item => refUpdator(item, refUpdates, changeLogger))
        .then(item => refreshCaches(item, null, options))
        .then(item => options.skipResult ? null : loadFiles(item, _this.fileStorage, _this.imageStorage))
        .then(item =>
          options.skipResult ? null :
          bubble(
            'create',
            item.getMetaClass(),
            {
              item: item,
              data: data,
              user: options.user
            }
          )
        )
        .then(writeEventHandler(changeLogger, options))
        .then(item => item ? calcProperties(item, options.skipResult, null) : null);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.ignoreIntegrityCheck]
   * @param {User} [options.user]
   * @param {Boolean} [options.skipCacheRefresh]
   * @param {Boolean} [options.adjustAutoInc]
   * @param {Boolean} [supressEvent]
   * @returns {Promise}
   */
  this._editItem = function (classname, id, data, changeLogger, options, supressEvent) {
    options = options || {};
    if (!id) {
      return Promise.reject(new IonError(Errors.BAD_PARAMS, {method: 'editItem'}));
    }
    if (isEmpty(data)) {
      return options.skipResult ?
        Promise.resolve() :
        this._getItem(classname, id, {nestingDepth: options.nestingDepth});
    }

    try {
      let cm = _this.meta.getMeta(classname);
      let rcm = getRootType(cm);

      /**
       * @var {{}}
       */
      let conditions = formUpdatedData(rcm, _this.keyProvider.keyToData(rcm, id));

      if (conditions) {
        conditions = dataToFilter(conditions);
        let base;
        let refUpdates = {};
        let da = {};
        let updates;

        let p;
        if (changeLogger) {
          p = _this.ds.get(tn(rcm), conditions).then(function (b) {
            base = b;
            if (supressEvent) {
              return Promise.resolve();
            }
            return bubble(
              'pre-edit',
              cm,
              {
                id: id,
                item: b && _this._wrap(b._class, b, b._classVer),
                data: data,
                user: options.user
              });
          });
        } else {
          p = supressEvent ? Promise.resolve() :
            bubble(
              'pre-edit',
              cm,
              {
                id: id,
                data: data,
                user: options.user
              }
            );
        }

        return p
          .then(preWriteEventHandler(data))
          .then(() => {
            updates = formUpdatedData(cm, data, false, refUpdates, da) || {};
            if (cm.getChangeTracker()) {
              updates[cm.getChangeTracker()] = new Date();
            }
            return checkRequired(cm, updates, true, options.ignoreIntegrityCheck);
          })
          .then(() => {
            let fileSavers = [];
            prepareFileSavers(id, cm, fileSavers, updates);
            return Promise.all(fileSavers);
          })
          .then(() => {
            if (options.user) {
              let editorAttr = '_editor';
              if (cm.getEditorTracker()) {
                editorAttr = cm.getEditorTracker();
              }
              updates[editorAttr] = options.user.id();
            }
            return _this.ds.update(
              tn(rcm),
              conditions,
              updates,
              {skipResult: false, adjustAutoInc: options.adjustAutoInc}
            );
          })
          .catch(wrapDsError('editItem', classname, null, null, cm))
          .then((data) => {
            if (!data) {
              throw new IonError(Errors.ITEM_NOT_FOUND, {info: `${classname}@${id}`});
            }
            let item = _this._wrap(data._class, data, data._classVer);
            if (updates._editor) {
              delete updates._editor;
            }
            return logChanges(changeLogger, {type: EventType.UPDATE, item: item, base: base, updates: updates});
          })
          .then(item => updateBackRefs(item, cm, data, id))
          .then(item => refUpdator(item, refUpdates, changeLogger))
          .then(item => refreshCaches(item, conditions, options))
          .then(item => loadFiles(item, _this.fileStorage, _this.imageStorage))
          .then((item) => {
            if (!supressEvent) {
              return bubble(
                'edit',
                item.getMetaClass(),
                {
                  item: item,
                  updates: data,
                  user: options.user
                }
              );
            }
            return {item: item};
          })
          .then(writeEventHandler(changeLogger, options))
          .then(item => calcProperties(item, options.skipResult));
      } else {
        return Promise.reject(new IonError(Errors.BAD_PARAMS, {method: 'editItem'}));
      }
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.autoAssign]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.ignoreIntegrityCheck]
   * @param {User} [options.user]
   * @param {Boolean} [options.skipCacheRefresh]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
  this._saveItem = function (classname, id, data, version, changeLogger, options) {
    options = options || {};

    if (isEmpty(data)) {
      return (options.skipResult || !id) ?
        Promise.resolve() :
        this._getItem(classname, id, {nestingDepth: options.nestingDepth});
    }

    try {
      let cm = _this.meta.getMeta(classname, version);

      if (cm.isAbstract()) {
        throw new Error('Обьект абстрактного класса не может быть создан!');
      }

      let rcm = getRootType(cm);

      let refUpdates = {};
      let da = {};
      let updates;
      let conditionsData;
      let event = EventType.UPDATE;
      let conditions = null;
      let base = null;

      let p;
      if (id) {
        conditionsData = _this.keyProvider.keyToData(rcm, id);
      } else {
        conditionsData = _this.keyProvider.keyData(rcm, data);
      }
      if (conditionsData) {
        conditions = formUpdatedData(rcm, conditionsData);
        conditions = dataToFilter(conditions);
      }
      if (changeLogger) {
        p = _this.ds.get(tn(rcm), conditions).then((b) => {
          base = b;
          return bubble(
            'pre-save',
            cm,
            {
              id: id,
              item: b && _this._wrap(b._class, b, b._classVer),
              data: data,
              user: options.user
            });
        });
      } else {
        p = bubble(
          'pre-save',
          cm,
          {
            id: id,
            data: data,
            user: options.user
          }
        );
      }

      return p
        .then(preWriteEventHandler(data))
        .then(() => {
          updates = formUpdatedData(cm, data, true, refUpdates, da) || {};
          if (options && options.autoAssign) {
            return autoAssign(cm, updates, true, options.user);
          } else {
            if (cm.getChangeTracker()) {
              updates[cm.getChangeTracker()] = new Date();
            }
          }
        })
        .then(() => {
          let fileSavers = [];
          prepareFileSavers(id || JSON.stringify(conditionsData), cm, fileSavers, updates);
          return Promise.all(fileSavers);
        })
        .then(() => {
          updates._class = cm.getCanonicalName();
          updates._classVer = cm.getVersion();
          if (conditions) {
            return checkRequired(cm, updates, true);
          } else {
            event = EventType.CREATE;
            return autoAssign(cm, updates, false, options.user)
              .then(() => checkRequired(cm, updates, false, options.ignoreIntegrityCheck));
          }
        })
        .then(() => {
          let opts = {
            skipResult: options.skipResult && !(da.refUpdates || da.backRefUpdates),
            adjustAutoInc: options.adjustAutoInc
          };
          return conditions ?
            _this.ds.upsert(tn(rcm), conditions, updates, opts) :
            _this.ds.insert(tn(rcm), updates, opts);
        })
        .catch(wrapDsError('saveItem', classname, id, null, cm))
        .then((d) => {
          let item;
          if (d && (typeof d === 'object')) {
            item = _this._wrap(d._class, d, d._classVer);
          } else {
            item = _this._wrap(classname, conditionsData || updates, null);
          }
          return logChanges(changeLogger, {type: event, item: item, base: base, updates: updates});
        })
        .then((item) => {
          if (!options.ignoreIntegrityCheck) {
            return updateBackRefs(item, cm, data, id || item.getItemId());
          } else {
            return item;
          }
        })
        .then((item) => {
          if (!options.ignoreIntegrityCheck) {
            return refUpdator(item, refUpdates, changeLogger);
          } else {
            return item;
          }
        })
        .then(item => refreshCaches(item, conditions, options))
        .then(item => loadFiles(item, _this.fileStorage, _this.imageStorage))
        .then(item =>
          bubble(
            'save',
            item.getMetaClass(),
            {
              item: item,
              updates: data,
              user: options.user
            }
          )
        )
        .then(writeEventHandler(changeLogger, options))
        .then(item => calcProperties(item, options.skipResult));
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {User} [options.user]
   * @param {Boolean} [options.skipCacheRefresh]
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    let cm = this.meta.getMeta(classname);
    let rcm = getRootType(cm);
    let item = null;

    let filter;
    return this._getItem(classname, id, options)
      .then((found) => {
        if (!found) {
          throw new IonError(Errors.ITEM_NOT_FOUND, {info: `${classname}@${id}`});
        }
        item = found;
        let dt = formUpdatedData(rcm, this.keyProvider.keyToData(rcm, id));
        let conditions = dataToFilter(dt);
        return prepareFilterValues(cm, conditions, []);
      })
      .then((f) => {
        filter = f;
        return bubble(
          'pre-delete',
          cm,
          {
            id: id,
            item: item,
            user: options.user
          }
        );
      })
      .then((e) => {
        if (e && e.canceled) {
          return Promise.resolve(EVENT_CANCELED);
        }
        return _this.ds.delete(tn(rcm), filter);
      })
      .catch(wrapDsError('deleteItem', classname, id))
      .then((result) => {
        if (result === EVENT_CANCELED) {
          return Promise.resolve(EVENT_CANCELED);
        }
        return logChanges(changeLogger, {type: EventType.DELETE, item: item, base: item.base, updates: {}})
          .then(() => bubble(
            'delete',
            item.getMetaClass(),
            {
              id: id,
              user: options.user
            }
          ))
          .then(e => refreshCaches(item, null, options).then(() => e));
      });
  };

  /**
   * @param {String} classname
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {User} [options.user]
   * @returns {Promise}
   */
  this._bulkDelete = function (classname, options) {
    options = options || {};

    let cm = _this.meta.getMeta(classname);
    let rcm = getRootType(cm);
    options.filter = addDiscriminatorFilter(options.filter, cm);
    return prepareFilterValues(cm, options.filter, []).then(filter => _this.ds.delete(tn(rcm), filter));
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipResult]
   * @param {User} [options.user]
   * @param {Boolean} [options.skipSubClasses]
   * @returns {Promise}
   */
  this._bulkEdit = function (classname, data, options) {
    options = options || {};
    try {
      let cm = _this.meta.getMeta(classname);
      let rcm = getRootType(cm);

      let refUpdates = {};
      let updates = formUpdatedData(cm, data, false, refUpdates) || {};
      if (cm.getChangeTracker()) {
        updates[cm.getChangeTracker()] = new Date();
      }
      let fileSavers = [];
      return checkRequired(cm, updates, true, true)
        .then(() => {
          prepareFileSavers('bulk', cm, fileSavers, updates);
          return Promise.all(fileSavers);
        })
        .then(() => prepareFilterValues(cm, addDiscriminatorFilter(options.filter, cm, options.skipSubClasses)))
        .then((filter) => {
          if (options.user) {
            updates._editor = options.user.id();
          }
          return _this.ds.update(tn(rcm), filter, updates, {skipResult: true, bulk: true});
        })
        .then((matched) => {
          if (options.skipResult) {
            return Promise.resolve(matched);
          }
          return _this._getIterator(classname, options);
        });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @param {Item[]} masters
   * @param {String[]} collections
   * @param {Item[]} details
   * @param {String} action - 'put' или 'eject' - вставка или извлечение
   * @returns {Promise}
   */
  function editCollections(masters, collections, details, action) {
    let worker = Promise.resolve();
    masters.forEach((m) => {
      worker = worker
        .then(() => _this._getItem(m.getMetaClass().getCanonicalName(), m.getItemId(), {
          skipEnrich: true,
          skipCalculations: true
        }))
        .then((m) => {
          if (m) {
            let cond = formUpdatedData(
              m.getMetaClass(),
              _this.keyProvider.keyToData(m.getMetaClass(), m.getItemId())
            );
            cond = dataToFilter(cond);
            let updates = {};
            let act = false;
            for (let k = 0; k < collections.length; k++) {
              let pm = m.getMetaClass().getPropertyMeta(collections[k]);
              if (pm && pm.type === PropertyTypes.COLLECTION) {
                let src = m.base[collections[k]] || [];
                for (let j = 0; j < details.length; j++) {
                  if (details[j]) {
                    if (action === 'eject') {
                      src.splice(src.indexOf(details[j].getItemId()), 1);
                    } else if (src.indexOf(details[j].getItemId()) < 0) {
                      if (
                        !Array.isArray(pm.allowedSubclasses) ||
                        isSubclassAllowed(m.getMetaClass(), pm.allowedSubclasses, details[j].getMetaClass())
                      ) {
                        src.push(details[j].getItemId());
                      } else {
                        throw new Error(`Обьекты класса "${details[j].getMetaClass().getCaption()}" недопустимы в коллекции "${m.getMetaClass().getCaption()}.${pm.caption}".`);
                      }
                    }
                  }
                }
                updates[collections[k]] = src;
                act = true;
              }
            }
            if (act) {
              let mrcm = getRootType(m.getMetaClass());
              return _this.ds.update(tn(mrcm), cond, updates, {skipResult: true});
            }
          }
        });
    });
    return worker;
  }

  function isSubclassAllowed(mc, asc, sc) {
    return (asc.indexOf(sc.getCanonicalName()) >= 0) || (asc.indexOf(sc.getName()) >= 0 && sc.getNamespace() === mc.getNamespace());
  }

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @returns {*}
   * @private
   */
  function _editCollection(master, collection, details, changeLogger, operation) {
    let pm = master.getMetaClass().getPropertyMeta(collection);
    if (!pm || pm.type !== PropertyTypes.COLLECTION) {
      return Promise.reject(
        new IonError(Errors.NO_COLLECTION, {info: `${master.getClassName()}@${master.getItemId()}`, attr: collection})
      );
    }

    let event = master.getMetaClass().getCanonicalName() + '.' + collection + '.' + (operation ? 'put' : 'eject');

    let asc = [];
    if (Array.isArray(pm.allowedSubclasses) && pm.allowedSubclasses.length) {
      asc = pm.allowedSubclasses;
    }

    if (pm.backRef) {
      let update = {};
      update[pm.backRef] = operation ? (pm.binding ? master.get(pm.binding) : master.getItemId()) : null;

      let writers = Promise.resolve();
      details.forEach((d) => {
        if (!asc.length || isSubclassAllowed(master.getMetaClass(), asc, d.getMetaClass())) {
          writers = writers.then(() => _this._editItem(d.getClassName(), d.getItemId(), update));
        } else {
          throw new Error(`Обьекты класса "${d.getMetaClass().getCaption()}" недопустимы в коллекции "${master.getMetaClass().getCaption()}.${pm.caption}".`);
        }
      });

      return writers
        .then(() => _this.trigger({
            type: event,
            master: master,
            details: details
          })
        );
    } else {
      return editCollections([master], [collection], details, operation ? 'put' : 'eject')
        .then(() => {
          if (pm.backColl) {
            let colls = [];
            for (let i = 0; i < details.length; i++) {
              let bcpm = details[i].getMetaClass().getPropertyMeta(pm.backColl);
              if (bcpm.type === PropertyTypes.COLLECTION) {
                colls.push(bcpm.name);
              }
            }
            if (colls.length === 0) {
              return Promise.resolve();
            }
            return editCollections(details, colls, [master], operation ? 'put' : 'eject');
          } else {
            let backColls = [];
            let parsed = {};
            for (let i = 0; i < details.length; i++) {
              if (!parsed.hasOwnProperty(details[i].getClassName())) {
                let props = details[i].getMetaClass().getPropertyMetas();
                for (let j = 0; j < props.length; j++) {
                  if (props[j].type === PropertyTypes.COLLECTION && props[j].backColl === collection) {
                    backColls.push(props[j].name);
                  }
                }
                parsed[details[i].getClassName()] = true;
              }
            }
            if (backColls.length === 0) {
              return Promise.resolve();
            }
            return editCollections(details, backColls, [master], operation ? 'put' : 'eject');
          }
        }).then(() => {
          let updates = {};
          updates[collection] = [];
          for (let i = 0; i < details.length; i++) {
            updates[collection].push({
              className: details[i].getMetaClass().getCanonicalName(),
              id: details[i].getItemId()
            });
          }
          return logChanges(
            changeLogger,
            {
              type: operation ? EventType.PUT : EventType.EJECT,
              item: master,
              updates: updates
            }
          );
        }).
        then(() => _this.trigger({type: event, master: master, details: details}));
    }
  }

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._put = function (master, collection, details, changeLogger) {
    return _editCollection(master, collection, details, changeLogger, true);
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._eject = function (master, collection, details, changeLogger) {
    return _editCollection(master, collection, details, changeLogger, false);
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{}} options
   * @param {Boolean} onlyCount - определяте получаемый результат, если true то только считаем количество
   * @returns {*}
   */
  function getCollection(master, collection, options, onlyCount) {
    let filter;

    if (!options) {
      options = {};
    }

    let pm = master.getMetaClass().getPropertyMeta(collection);
    if (!pm) {
      return Promise.reject(
        new IonError(Errors.NO_COLLECTION, {info: `${master.getClassName()}@${master.getItemId()}`, attr: collection})
      );
    }

    if (!options.sort && Array.isArray(pm.selSorting) && pm.selSorting.length) {
      options.sort = sortingParser(pm.selSorting);
    }

    let detailCm = pm._refClass;
    if (!detailCm) {
      return Promise.reject(
        new IonError(Errors.INVALID_META, {info: `${master.getClassName()}@${master.getItemId()}`})
      );
    }

    if (pm.backRef) {
      filter = {
        [Operations.EQUAL]: [
          '$' + pm.backRef,
          pm.binding ? master.get(pm.binding) : master.get(master.getMetaClass().getKeyProperties()[0])
        ]
      };
      if (pm.selConditions) {
        let tmp = Array.isArray(pm.selConditions) ? conditionParser(pm.selConditions, pm._refClass, master) : pm.selConditions;
        if (tmp) {
          filter = {[Operations.AND]: [filter, tmp]};
        }
      }
      options.filter = options.filter ? {[Operations.AND]: [filter, options.filter]} : filter;
      if (onlyCount) {
        return _this._getCount(detailCm.getCanonicalName(), options);
      }
      return _this._getList(detailCm.getCanonicalName(), options);
    } else {
      let kp = detailCm.getKeyProperties();
      if (kp.length > 1) {
        return Promise.reject(
          new IonError(Errors.COMPOSITE_KEY, {oper: 'getCollection'})
        );
      }

      return _this._getItem(master.getClassName(), master.getItemId(), {skipEnrich: true, skipCalculations: true})
        .then(function (m) {
          if (m) {
            let filter = filterByItemIds(_this.keyProvider, detailCm, m.base[collection] || []);
            options.filter = options.filter ? {[Operations.AND]: [options.filter, filter]} : filter;
            if (onlyCount) {
              return _this._getCount(detailCm.getCanonicalName(), options);
            }
            return _this._getList(detailCm.getCanonicalName(), options);
          } else {
            throw new IonError(Errors.ITEM_NOT_FOUND, {info: `${master.getClassName()}@${master.getItemId()}`});
          }
        });
    }
  }

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {Object} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {{}} [options.needed]
   * @returns {Promise}
   */
  this._getAssociationsList = function (master, collection, options) {
    return getCollection(master, collection, options, false);
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {{filter: Object}} [options]
   * @returns {Promise}
   */
  this._getAssociationsCount = function (master, collection, options) {
    return getCollection(master, collection, options, true);
  };

  /**
   * @param {ResourceStorage} storage
   */
  this.setFileStorage = function (storage) {
    this.fileStorage = storage;
  };

  /**
   * @param {ResourceStorage} storage
   */
  this.setImageStorage = function (storage) {
    this.imageStorage = storage;
  };

  /**
   * @param {Item} item
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._recache = function (item, options) {
    return refreshCaches(item, null, options);
  };
}

IonDataRepository.prototype = new DataRepository();
module.exports = IonDataRepository;
