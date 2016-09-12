// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

var DataRepositoryModule = require('core/interfaces/DataRepository');
var DataRepository = DataRepositoryModule.DataRepository;
var Item = DataRepositoryModule.Item;
var PropertyTypes = require('core/PropertyTypes');
var cast = require('core/cast');
var EventType = require('core/interfaces/ChangeLogger').EventType;
var uuid = require('node-uuid');

/* jshint maxstatements: 40, maxcomplexity: 40 */
/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {MetaRepository} options.metaRepository
 * @param {KeyProvider} options.keyProvider
 * @param {String} [options.namespaceSeparator]
 * @constructor
 */
function IonDataRepository(options) {
  var _this = this;
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
  this.fs = options.fileStorage;

  this.namespaceSeparator = options.namespaceSeparator || '_';

  /**
   * @param {ClassMeta} cm
   * @returns {String}
   */
  function tn(cm) {
    return (cm.getNamespace() ? cm.getNamespace() + _this.namespaceSeparator : '') + cm.getName();
  }

  /**
   *
   * @param {Object[]} validators
   * @returns {Promise}
   */
  this._setValidators = function (validators) {
    return new Promise(function (resolve) { resolve(); });
  };

  /**
   * @param {String | Item} obj
   * @private
   * @returns {ClassMeta | null}
   */
  this._getMeta = function (obj) {
    if (typeof obj === 'string') {
      return this.meta.getMeta(obj);
    } else if (typeof obj === 'object' && obj.constructor.name === 'Item') {
      return obj.classMeta;
    }
    return null;
  };

  /**
   * @param {ClassMeta} cm
   * @private
   * @returns {ClassMeta}
   */
  this._getRootType = function (cm) {
    if (cm.ancestor) {
      return this._getRootType(cm.ancestor);
    }
    return cm;
  };

  /**
   * @param {Object} filter
   * @param {ClassMeta} cm
   * @private
   */
  this._addDiscriminatorFilter = function (filter, cm) {
    var descendants = this.meta.listMeta(cm.getCanonicalName(), cm.getVersion(), false, cm.getNamespace());
    var cnFilter = [cm.getCanonicalName()];
    for (var i = 0; i < descendants.length; i++) {
      cnFilter[cnFilter.length] = descendants[i].getCanonicalName();
    }

    if (!filter) {
      return {_class: {$in: cnFilter}};
    } else {
      return {$and: [filter, {_class: {$in: cnFilter}}]};
    }
  };

  /**
   * @param {Object} filter
   * @param {Item} item
   * @returns {Object}
   * @private
   */
  this._addFilterByItem = function (filter, item) {
    if (typeof item === 'object' && item.constructor.name === 'Item') {
      var conditions, props;
      conditions = [filter];
      props = item.getProperties();
      for (var nm in props) {
        if (props.hasOwnProperty(nm) && item.base.hasOwnProperty(nm)) {
          var c = {};
          c[nm] = item.base[nm];
          conditions[conditions.length] = c;
        }
      }
      return {$and: conditions};
    }
    return filter;
  };

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @private
   * @returns {Item | null}
   */
  this._wrap = function (className, data, version) {
    var acm = this.meta.getMeta(className, version);
    return new Item(this.keyProvider.formKey(acm.getName(), data, acm.getNamespace()), data, acm);
  };

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object}} [options]
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    if (!options) {
      options = {};
    }
    var cm = this._getMeta(obj);
    var rcm = this._getRootType(cm);
    options.filter = this._addFilterByItem(options.filter, obj);
    options.filter = this._addDiscriminatorFilter(options.filter, cm);
    return this.ds.count(tn(rcm), options);
  };

  /**
   * @param {Item} item
   * @param {Property} property
   * @param {{}} attrs
   */
  function prepareRefEnrichment(item, property, attrs) {
    var refc = _this.meta.getMeta(property.meta.refClass, null, item.classMeta.getNamespace());
    if (refc) {
      if (!attrs.hasOwnProperty(item.classMeta.getName() + '.' + property.getName())) {
        attrs[item.classMeta.getName() + '.' + property.getName()] = {
          type: PropertyTypes.REFERENCE,
          refClassName: refc.getCanonicalName(),
          attrName: property.getName(),
          key: refc.getKeyProperties()[0],
          pIndex: 0,
          filter: []
        };
      }

      var v = item.get(property.getName());
      if (v) {
        attrs[item.classMeta.getName() + '.' + property.getName()].filter.push(v);
        if (typeof item.references === 'undefined') {
          item.references = {};
        }
      }
    }
  }

  /**
   * @param {Item} item
   * @param {Property} property
   * @param {{}} attrs
   */
  function prepareColEnrichment(item, property, attrs) {
    var refc = _this.meta.getMeta(property.meta.itemsClass, null, item.classMeta.getNamespace());
    if (refc) {
      if (!attrs.hasOwnProperty(item.classMeta.getName() + '.' + property.getName())) {
        attrs[item.classMeta.getName() + '.' + property.getName()] = {
          type: PropertyTypes.COLLECTION,
          colClassName: refc.getCanonicalName(),
          attrName: property.getName(),
          key: refc.getKeyProperties()[0],
          backRef: property.meta.backRef,
          pIndex: 0,
          colItems: []
        };
      }

      if (property.meta.backRef && !property.meta.backColl) {
        if (property.meta.binding) {
          attrs[item.classMeta.getName() + '.' + property.getName()].colItems.push(item.get(property.meta.binding));
        } else {
          attrs[item.classMeta.getName() + '.' + property.getName()].colItems.push(item.getItemId());
        }
      } else {
        var v = item.get(property.getName());
        if (v) {
          attrs[item.classMeta.getName() + '.' + property.getName()].colItems =
            attrs[item.classMeta.getName() + '.' + property.getName()].colItems.concat(v);
        }
      }
      if (typeof item.collections === 'undefined') {
        item.collections = [];
      }
    }
  }

  /**
   * @param {Array} src
   * @param {Number} depth
   * @returns {Promise}
   */
  function enrich(src, depth) {
    if (depth <= 0) {
      return new Promise(function (resolve) {
        resolve(src);
      });
    }

    return new Promise(function (resolve, reject) {
      var i, nm, attrs, item, props, promises, filter, cn;

      attrs = {};
      promises = [];

      try {
        for (i = 0; i < src.length; i++) {
          item = src[i];
          if (item && item.constructor.name === 'Item') {
            props = item.getProperties();
            for (nm in props) {
              if (props.hasOwnProperty(nm)) {
                if (props[nm].getType() === PropertyTypes.REFERENCE) {
                  prepareRefEnrichment(item, props[nm], attrs);
                } else if (props[nm].getType() === PropertyTypes.COLLECTION && props[nm].eagerLoading()) {
                  prepareColEnrichment(item, props[nm], attrs);
                }
              }
            }
          }
        }

        promises = [];

        i = 0;
        for (nm in attrs) {
          if (attrs.hasOwnProperty(nm)) {
            attrs[nm].pIndex = i;
            i++;

            if (
              attrs[nm].type  === PropertyTypes.REFERENCE &&
              Array.isArray(attrs[nm].filter) &&
              attrs[nm].filter.length
            ) {
              filter = {};
              filter[attrs[nm].key] = {$in: attrs[nm].filter};
              cn = attrs[nm].refClassName;
            } else if (
              attrs[nm].type  === PropertyTypes.COLLECTION &&
              Array.isArray(attrs[nm].colItems) &&
              attrs[nm].colItems.length
            ) {
              filter = {};
              filter[attrs[nm].backRef ? attrs[nm].backRef : attrs[nm].key] = {$in: attrs[nm].colItems};
              cn = attrs[nm].colClassName;
            }

            if (filter) {
              promises.push(_this.getList(cn, {
                filter: filter,
                nestingDepth: depth - 1
              }));
            }
          }
        }
      } catch (err) {
        reject(err);
      }

      if (promises.length === 0) {
        resolve(src);
      }

      Promise.all(promises).then(
        function (results) {
          var nm, items, itemsByKey, srcByKey, ids, i, j;
          for (nm in attrs) {
            if (attrs.hasOwnProperty(nm)) {
              items = results[attrs[nm].pIndex];
              if (items.length === 0) {
                continue;
              }
              if (attrs[nm].type === PropertyTypes.REFERENCE) {
                itemsByKey = {};
                for (i = 0; i < items.length; i++) {
                  itemsByKey[items[i].getItemId()] = items[i];
                }

                for (i = 0; i < src.length; i++) {
                  if (itemsByKey.hasOwnProperty(src[i].base[attrs[nm].attrName])) {
                    src[i].references[attrs[nm].attrName] = itemsByKey[src[i].base[attrs[nm].attrName]];
                  }
                }
              } else if (attrs[nm].type === PropertyTypes.COLLECTION) {
                if (attrs[nm].backRef) {
                  if (!srcByKey) {
                    srcByKey = {};

                    for (i = 0; i < src.length; i++) {
                      srcByKey[src[i].getItemId()] = src[i];
                    }
                  }

                  for (i = 0; i < items.length; i++) {
                    if (srcByKey.hasOwnProperty(items[i].base[attrs[nm].backRef])) {
                      if (typeof srcByKey[items[i].base[attrs[nm].backRef]].
                          collections[attrs[nm].attrName] === 'undefined') {
                        srcByKey[items[i].base[attrs[nm].backRef]].collections[attrs[nm].attrName] = [];
                      }
                      srcByKey[items[i].base[attrs[nm].backRef]].collections[attrs[nm].attrName].push(items[i]);
                    }
                  }
                } else {
                  itemsByKey = {};
                  for (i = 0; i < items.length; i++) {
                    itemsByKey[items[i].getItemId()] = items[i];
                  }
                  for (i = 0; i < src.length; i++) {
                    ids = src[i].get(attrs[nm].attrName) || [];
                    src[i].collections[attrs[nm].attrName] = [];
                    for (j = 0; j < ids.length; j++) {
                      if (itemsByKey.hasOwnProperty(ids[i])) {
                        src[i].collections[attrs[nm].attrName].push(itemsByKey[ids[j]]);
                      }
                    }
                  }
                }
              }
            }
          }
          resolve(src);
        }
      ).catch(reject);
    });
  }

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  function loadFiles(item) {
    var pm;
    var fids = [];
    var attrs = {};
    for (var nm in item.base) {
      if (item.base.hasOwnProperty(nm) && item.base[nm]) {
        pm = item.classMeta.getPropertyMeta(nm);
        if (pm && (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE)) {
          fids.push(item.base[nm]);
          if (!attrs.hasOwnProperty('f_' + item.base[nm])) {
            attrs['f_' + item.base[nm]] = [];
          }
          attrs['f_' + item.base[nm]].push(nm);
        }
      }
    }
    return new Promise(function (resolve, reject) {
      if (fids.length === 0) {
        resolve(item);
        return;
      }

      _this.fs.fetch(fids)
        .then(
          function (files) {
            for (var i = 0; i < files.length; i++) {
              if (attrs.hasOwnProperty('f_' + files[i].id)) {
                for (var j = 0; j < attrs['f_' + files[i].id].length; j++) {
                  item.files[attrs['f_' + files[i].id][j]] = files[i];
                }
              }
            }
            resolve(item);
          }
        )
        .catch(reject);
    });
  }

  /**
   * @param {ClassMeta} cm
   * @param {*} filter
   * @returns {*}
   */
  function prepareFilter(cm, filter) {
    var result, i, nm, keys, knm;
    if (filter && Array.isArray(filter)) {
      result = [];
      for (i = 0; i < filter.length; i++) {
        result.push(prepareFilter(cm, filter[i]));
      }
      return result;
    } else if (filter && typeof filter === 'object') {
      result = {};
      for (nm in filter) {
        if (filter.hasOwnProperty(nm)) {
          if (nm === '$ItemId') {
            if (typeof filter[nm] === 'string') {
              keys = formUpdatedData(cm, _this.keyProvider.keyToData(cm.getName(), filter[nm], cm.getNamespace()));
              for (knm in keys) {
                if (keys.hasOwnProperty(knm)) {
                  result[knm] = keys[knm];
                }
              }
            } else {
              result[cm.getKeyProperties()[0]] = filter[nm];
            }
          } else {
            result[nm] = prepareFilter(cm, filter[nm]);
          }
        }
      }
      return result;
    }
    return filter;
  }

  /**
   * @param {String | Item} obj
   * @param {Object} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this._getList = function (obj, options) {
    if (!options) {
      options = {};
    }
    var cm = this._getMeta(obj);
    var rcm = this._getRootType(cm);
    options.filter = this._addFilterByItem(options.filter, obj);
    options.filter = this._addDiscriminatorFilter(options.filter, cm);
    options.filter = prepareFilter(rcm, options.filter);
    return new Promise(function (resolve, reject) {
      var result = [];
      _this.ds.fetch(tn(rcm), options)
        .then(
          function (data) {
            var fl = [];
            try {
              for (var i = 0; i < data.length; i++) {
                result[i] = _this._wrap(data[i]._class, data[i], data[i]._classVer);
                fl.push(loadFiles(result[i]));
              }
            } catch (err) {
              return reject(err);
            }

            if (typeof data.total !== 'undefined' && data.total !== null) {
              result.total = data.total;
            }

            return new Promise(function (rs, rj) {
              Promise.all(fl).then(function () {
                resolve(result);
              }).catch(rj);
            });
          }
        ).
        then(function (result) {
          return enrich(result, options.nestingDepth ? options.nestingDepth : 0);
        }).
        then(resolve).
        catch(reject);
    });
  };

  /**
   *
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {Number} [nestingDepth]
   */
  this._getItem = function (obj, id, nestingDepth) {
    var cm = this._getMeta(obj);
    var rcm = this._getRootType(cm);
    if (id) {
      return new Promise(function (resolve, reject) {
        var updates = formUpdatedData(rcm, _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace()));
        _this.ds.get(tn(rcm), updates).
        then(function (data) {
          var result = [];
          var item = null;
          if (data) {
            try {
              item = _this._wrap(data._class, data, data._classVer);
              result.push(item);
              loadFiles(item).
              then(
                function (item) {
                  return enrich([item], nestingDepth ? nestingDepth : 0);
                }
              ).
              then(
                function (items) {
                  resolve(items[0]);
                }
              ).
              catch(reject);
              return;
            } catch (err) {
              return reject(err);
            }
          }
          resolve(null);
        }).catch(reject);
      });
    } else {
      var options = {};
      options.filter = this._addFilterByItem({}, obj);
      options.filter = this._addDiscriminatorFilter(options.filter, cm);
      options.count = 1;
      return new Promise(function (resolve, reject) {
        _this.ds.fetch(tn(rcm), options).then(function (data) {
          var item;
          for (var i = 0; i < data.length; i++) {
            item = _this._wrap(data[i]._class, data[i], data[i]._classVer);
            return loadFiles(item);
          }
          resolve(null);
        }).
        then(function (item) {
          return enrich([item]);
        }).
        then(function (items) { resolve(items[0]); }).
        catch(reject);
      });
    }
  };

  /*
  Данный метод на будущее - если будет реализовываться редактирование вложенных объектов

   * @param {Item} item
   * @param {{}} values
   * @param {ChangeLogger} [logger]

  function processRefItems(item,values,logger) {
    var updates = {};

    for (var key in values) {
      if (values.hasOwnProperty(key) && key.indexOf('.') > -1) {
        var splittedKey = key.split('.');
        var ref = splittedKey[0];
        var nm = splittedKey[1];
        if (!updates.hasOwnProperty(ref)) {
          updates[ref] = {};
        }
        updates[ref][nm] = values[key];
      }
    }

    for (var refProperty in updates) {
      if (updates.hasOwnProperty(refProperty)) {
        var p = item.property(refProperty);
        if (p && p.getType() === PropertyTypes.REFERENCE) {
          var v = p.getValue();
          var refc = _this.meta.getMeta(rp.refClass, null, item.classMeta.getNamespace());
          var rp = p.getMeta();
          if (v) {
            _this.editItem(cn(refc), v, updates[refProperty], logger);
          } else {
            var ri = _this.createItem(cn(refc), updates[refProperty], logger);
            values[refProperty] = ri.getItemId();
          }
        }
      }
    }
    return values;
  }
  */

  /* jshint maxcomplexity: 20 */
  /**
   * @param {*} value
   * @param {{ type: Number, refClass: String }} pm
   * @param {String} ns
   * @returns {*}
   */
  function castValue(value, pm, ns) {
    if (value === null) {
      return value;
    }
    if (pm.type === PropertyTypes.REFERENCE) {
      var refcm = _this.meta.getMeta(pm.refClass, null, ns);
      var refkey = refcm.getPropertyMeta(refcm.getKeyProperties()[0]);

      if (refkey) {
        return castValue(value, refkey, ns);
      }
      return value;
    }

    return cast(value, pm.type);
  }

  /**
   * @param {ClassMeta} cm
   * @param {Object} data
   */
  function formUpdatedData(cm, data) {
    var updates, pm, nm;
    updates = {};
    for (nm in data) {
      if (data.hasOwnProperty(nm)) {
        pm = cm.getPropertyMeta(nm);
        if (pm) {
          if (pm.type !== PropertyTypes.COLLECTION) {
            data[nm] = castValue(data[nm], pm, cm.namespace);
            updates[nm] = data[nm];
          }
        }
      }
    }
    return updates;
  }

  function fileSaver(updates, nm) {
    return new Promise(function (rs, rj) {
      _this.fs.accept(updates[nm]).then(function (id) {
        updates[nm] = id;
        rs();
      }).catch(rj);
    });
  }

  /**
   * @param {ClassMeta} cm
   * @param {{}} data
   */
  function checkRequired(cm, data, lazy) {
    var props = cm.getPropertyMetas();
    var invalidAttrs = [];
    for (var i = 0; i < props.length; i++) {
      if (!props[i].nullable && (
          lazy && data.hasOwnProperty(props[i].name) && data[props[i].name] === null ||
          !lazy && !props[i].autoassigned && (!data.hasOwnProperty(props[i].name) || data[props[i].name] === null)
        )) {
        invalidAttrs.push(props[i].caption);
      }
    }
    if (invalidAttrs.length) {
      return new Error('Не заполнены обязательные атрибуты: ' + invalidAttrs.join(', '));
    }
    return true;
  }

  /**
   *
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {Number} [nestingDepth]
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, nestingDepth) {
    return new Promise(function (resolve, reject) {
      try {
        var cm = _this.meta.getMeta(classname, version);
        var rcm = _this._getRootType(cm);

        var updates = formUpdatedData(cm, data);
        var properties = cm.getPropertyMetas();
        var pm;

        var fileSavers = [];

        if (cm.getCreationTracker()) {
          updates[cm.getCreationTracker()] = new Date();
        }

        if (cm.getChangeTracker()) {
          updates[cm.getChangeTracker()] = new Date();
        }

        for (var i = 0;  i < properties.length; i++) {
          pm = properties[i];
          if (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) {
            if (updates.hasOwnProperty(pm.name) && updates[pm.name] && typeof updates[pm.name] === 'object') {
              fileSavers.push(fileSaver(updates, pm.name));
            }
          }

          if (pm.autoassigned) {
            switch (pm.type) {
              case PropertyTypes.STRING:
              case PropertyTypes.GUID: {
                updates[pm.name] = uuid.v1();
              }break;
              case PropertyTypes.DATETIME: {
                updates[pm.name] = new Date();
              }break;
              case PropertyTypes.INT: {
                delete updates[pm.name];
              }break;
            }
          } else if (pm.defaultValue) {
            try {
              switch (pm.type) {
                case PropertyTypes.DATETIME: {
                  updates[pm.name] = new Date(pm.defaultValue); // TODO Использовать moment
                }break;
                case PropertyTypes.INT: {
                  updates[pm.name] = parseInt(pm.defaultValue);
                }break;
                case PropertyTypes.REAL:
                case PropertyTypes.DECIMAL: {
                  updates[pm.name] = parseFloat(pm.defaultValue);
                }break;
                default: {
                  updates[pm.name] = pm.defaultValue;
                }break;
              }
            } catch (err) {
            }
          }
        }

        var chr = checkRequired(cm, updates, false);
        if (chr !== true) {
          return reject(chr);
        }

        Promise.all(fileSavers).then(function () {
          updates._class = cm.getCanonicalName();
          updates._classVer = cm.getVersion();
          return _this.ds.insert(tn(rcm), updates);
        }).then(function (data) {
          var item = _this._wrap(data._class, data, data._classVer);
          if (changeLogger) {
            return new Promise(function (resolve, reject) {
              changeLogger.LogChange(
                EventType.CREATE,
                item.getMetaClass().getCanonicalName(),
                item.getItemId(),
                updates
              ).then(function () {
                resolve(item);
              }).catch(reject);
            });
          } else {
            return new Promise(function (resolve) {
              resolve(item);
            });
          }
        }).then(function (item) {
          return loadFiles(item);
        }).then(function (item) {
          return enrich([item], nestingDepth !== null ? nestingDepth : 1);
        }).then(function (items) {
          resolve(items[0]);
        }).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {ChangeLogger} [changeLogger]
   * @param {Number} [nestingDepth]
   * @returns {Promise}
   */
  this._editItem = function (classname, id, data, changeLogger, nestingDepth) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error('Не передан идентификатор объекта!'));
      }
      try {
        var cm = _this.meta.getMeta(classname);
        var rcm = _this._getRootType(cm);

        /**
         * @var {{}}
         */
        var conditions = formUpdatedData(rcm, _this.keyProvider.keyToData(rcm.getCanonicalName(), id));

        if (conditions) {
          var updates = formUpdatedData(cm, data);
          var properties = cm.getPropertyMetas();
          var pm;

          var fileSavers = [];

          if (cm.getChangeTracker()) {
            updates[cm.getChangeTracker()] = new Date();
          }

          for (var i = 0;  i < properties.length; i++) {
            pm = properties[i];
            if (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) {
              if (updates.hasOwnProperty(pm.name) && updates[pm.name] && typeof updates[pm.name] === 'object') {
                fileSavers.push(fileSaver(updates, pm.name));
              }
            }
          }

          var chr = checkRequired(cm, updates, true);
          if (chr !== true) {
            return reject(chr);
          }

          Promise.all(fileSavers).then(function () {
            return _this.ds.update(tn(rcm), conditions, updates);
          }).then(function (data) {
            var item = _this._wrap(data._class, data, data._classVer);
            if (changeLogger) {
              return new Promise(function (resolve, reject) {
                changeLogger.LogChange(
                  EventType.UPDATE,
                  item.getMetaClass().getCanonicalName(),
                  item.getItemId(),
                  updates
                ).then(function () {
                  resolve(item);
                }).catch(reject);
              });
            } else {
              return new Promise(function (resolve) {
                resolve(item);
              });
            }
            // }).then(function (item) { - Пока отключено редактирование коллекций при EditItem
            // return updateCollections(data, item, id);
          }).then(function (item) {
            return loadFiles(item);
          }).then(function (item) {
            return enrich([item], nestingDepth !== null ? nestingDepth : 1);
          }).then(function (items) {
            resolve(items[0]);
          }).catch(reject);
        } else {
          reject({Error: 'Не указан идентификатор объекта!'});
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {Number} [nestingDepth]
   * @returns {Promise}
   */
  this._saveItem = function (classname, id, data, version, changeLogger, nestingDepth) {
    return new Promise(function (resolve, reject) {
      var fileSavers = [];
      try {
        var cm = _this.meta.getMeta(classname, version);
        var rcm = _this._getRootType(cm);

        var updates = formUpdatedData(cm, data);
        var conditionsData;

        if (id) {
          conditionsData = _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace());
        } else {
          conditionsData = _this.keyProvider.keyData(rcm.getName(), updates, rcm.getNamespace());
        }

        var conditions = formUpdatedData(rcm, conditionsData);

        var event = EventType.UPDATE;

        var properties = cm.getPropertyMetas();
        var pm;

        if (cm.getChangeTracker()) {
          updates[cm.getChangeTracker()] = new Date();
        }

        for (var i = 0;  i < properties.length; i++) {
          pm = properties[i];
          if (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) {
            if (updates.hasOwnProperty(pm.name) && updates[pm.name] && typeof updates[pm.name] === 'object') {
              fileSavers.push(fileSaver(updates, pm.name));
            }
          }
        }

        var chr = checkRequired(cm, updates, false);
        if (chr !== true) {
          return reject(chr);
        }

        Promise.all(fileSavers).then(function () {
          try {
            updates._class = cm.getCanonicalName();
            updates._classVer = cm.getVersion();
            if (conditions) {
              // TODO Отлавливать создание объекта, отрабатывать соответствующую логику, например автоприсваивание
              return _this.ds.upsert(tn(rcm), conditions, updates);
            } else {
              if (cm.getCreationTracker()) {
                updates[cm.getCreationTracker()] = new Date();
              }
              event = EventType.CREATE;
              return _this.ds.insert(tn(rcm), updates);
            }
          } catch (err) {
            reject(err);
          }
        }).then(function (data) {
          var item = _this._wrap(data._class, data, data._classVer);
          if (changeLogger) {
            return new Promise(function (resolve, reject) {
              changeLogger.LogChange(
                event,
                item.getMetaClass().getCanonicalName(),
                item.getItemId(),
                updates
              ).then(function () {
                resolve([item]);
              }).catch(reject);
            });
          } else {
            return new Promise(function (resolve) {
              resolve([item]);
            });
          }
        }).then(function (item) {
          return loadFiles(item);
        }).then(function (item) {
          return enrich([item], nestingDepth !== null ? nestingDepth : 1);
        }).then(function (items) {
          resolve(items[0]);
        }).catch(reject);
      } catch (err) {
        return reject(err);
      }
    });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   */
  this._deleteItem = function (classname, id, changeLogger) {
    var cm = _this.meta.getMeta(classname);
    var rcm = _this._getRootType(cm);
    // TODO Каким-то образом реализовать извлечение из всех возможных коллекций
    return new Promise(function (resolve, reject) {
      var updates = formUpdatedData(rcm, _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace()));
      _this.ds.delete(tn(rcm), updates).then(function () {
        if (changeLogger) {
          changeLogger.LogChange(
            EventType.DELETE,
            cm.getCanonicalName(),
            id,
            {}).
          then(resolve).
          catch(reject);
        } else {
          resolve();
        }
      }).catch(reject);
    });
  };

  /**
   * @param {Item[]} masters
   * @param {String[]} collections
   * @param {Item[]} details
   * @param {String} action - 'put' или 'eject' - вставка или извлечение
   * @returns {Promise}
   */
  function editCollections(masters, collections, details, action) {
    return new Promise(function (resolve, reject) {
      var getters = [];
      for (var i = 0; i < masters.length; i++) {
        getters.push(_this._getItem(masters[i].getMetaClass().getCanonicalName(), masters[i].getItemId(), 0));
      }

      Promise.all(getters).
      then(function (m) {
        var writers = [];
        var i, j, k;
        for (i = 0; i < m.length; i++) {
          if (m[i]) {
            var cond = formUpdatedData(
              m[i].getMetaClass(),
              _this.keyProvider.keyToData(
                m[i].getMetaClass().getName(),
                m[i].getItemId(),
                m[i].getMetaClass().getNamespace())
            );
            var updates = {};
            var src;
            for (j = 0; j < details.length; j++) {
              for (k = 0; k < collections.length; k++) {
                src = m.base[collections[k]] || [];
                if (action === 'eject') {
                  src.splice(src.indexOf(details[j].getItemId()), 1);
                } else if (src.indexOf(details[j].getItemId()) < 0) {
                  src.push(details[j].getItemId());
                }
                updates[collections[k]] = src;
              }
            }
            var mrcm = this._getRootType(m[i].getMetaClass());
            writers.push(_this.ds.update(tn(mrcm), cond, updates));
          }
        }
        return Promise.all(writers);
      }).
      then(resolve).
      catch(reject);
    });
  }

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {String} operation
   * @returns {*}
   * @private
   */
  function _editCollection(master, collection, details, changeLogger, operation) {
    return new Promise(function (resolve, reject) {
      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      if (pm.backRef) {
        var update = {};
        update[pm.backRef] = operation ? pm.binding ? master.get(pm.binding) : master.getItemId() : null;

        var writers = [];
        for (var i = 0; i < details.length; i++) {
          writers.push(_this._editItem(details[i].getMetaClass().getCanonicalName(), details[i].getItemId(), update));
        }

        Promise.all(writers).then(function () {
          resolve();
        }).catch(reject);
      } else {
        editCollections([master], [collection], details, operation ? 'put' : 'eject').
        then(function () {
          var props;
          var backColls = [];
          var parsed = {};
          for (var i = 0; i < details.length; i++) {
            if (!parsed.hasOwnProperty(details[i].getClassName())) {
              props = details[i].getMetaClass().getPropertyMetas();
              for (var j = 0; j < props.length; i++) {
                if (props[i].type === PropertyTypes.COLLECTION && props[i].backColl === collection) {
                  backColls.push(props[i].name);
                }
              }
              parsed[details[i].getClassName()] = true;
            }
          }
          if (backColls.length === 0) {
            return new Promise(function (r) {r();});
          }
          return editCollections(details, backColls, [master], operation ? 'put' : 'eject');
        }).then(function () {
          if (changeLogger) {
            var updates = {};
            updates[collection] = [];
            for (var i = 0; i < details.length; i++) {
              updates[collection].push({
                className: details[i].getMetaClass().getCanonicalName(),
                id: details[i].getItemId()
              });
            }
            changeLogger.LogChange(
              operation ? EventType.PUT : EventType.EJECT,
              master.getMetaClass().getCanonicalName(),
              master.getItemId(),
              updates);
          } else {
            resolve();
          }
        }).catch(reject);
      }
    });
  }

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
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
   * @returns {Promise}
   */
  this._eject = function (master, collection, details, changeLogger) {
    return _editCollection(master, collection, details, changeLogger, false);
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{}} options
   * @param {Boolean} onlyCount - определяте получаемы результат, если true то только считаем количество
   * @returns {*}
   */
  function getCollection(master, collection, options, onlyCount) {
    return new Promise(function (resolve, reject) {
      if (!options) {
        options = {};
      }

      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      var detailCm = _this.meta.getMeta(pm.itemsClass, null, master.getMetaClass().getNamespace());
      if (!detailCm) {
        return reject(new Error('Не найден класс элементов коллекции!'));
      }

      if (pm.backRef) {
        var filter = {};
        filter[pm.backRef] = pm.binding ? master.get(pm.binding) : master.getItemId();
        options.filter = options.filter ? {$and: [options.filter, filter]} : filter;
        _this._getList(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
      } else {
        var key = null;
        var kp = detailCm.getKeyProperties();
        if (kp.length > 1) {
          reject(new Error('Коллекции многие-ко-многим на составных ключах не поддерживаются!'));
        }

        key = kp[0];

        _this._getItem(master.getClassName(), master.getItemId(), 0).then(function (m) {
          if (m) {
            var filter = {};
            filter[key] = {$in: m.base[collection] || []};
            options.filter = options.filter ? {$and: [options.filter, filter]} : filter;
            if (onlyCount) {
              _this._getCount(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
            } else {
              _this._getList(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
            }
          } else {
            reject(new Error('Не найден контейнер коллекции!'));
          }
        }).catch(reject);
      }
    });
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
}

IonDataRepository.prototype = new DataRepository();
module.exports = IonDataRepository;
