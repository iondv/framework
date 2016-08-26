// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

var DataRepositoryModule = require('core/interfaces/DataRepository');
var DataRepository = DataRepositoryModule.DataRepository;
var Item = DataRepositoryModule.Item;
var PropertyTypes = require('core/PropertyTypes');
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
    var refc = _this.meta.getMeta(property.meta.ref_class, null, item.classMeta.getNamespace());
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
    var refc = _this.meta.getMeta(property.meta.items_class, null, item.classMeta.getNamespace());
    if (refc) {
      if (!attrs.hasOwnProperty(item.classMeta.getName() + '.' + property.getName())) {
        attrs[item.classMeta.getName() + '.' + property.getName()] = {
          type: PropertyTypes.COLLECTION,
          colClassName: refc.getCanonicalName(),
          attrName: property.getName(),
          key: refc.getKeyProperties()[0],
          backRef: property.meta.back_ref,
          pIndex: 0,
          colItems: []
        };
      }

      if (property.meta.back_ref && !property.meta.back_coll) {
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
   *
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
          var refc = _this.meta.getMeta(rp.ref_class, null, item.classMeta.getNamespace());
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
   * @param {{ type: Number, ref_class: String }} pm
   * @param {String} ns
   * @returns {*}
   */
  function castValue(value, pm, ns) {
    if (value === null) {
      return value;
    }
    if (pm.type === PropertyTypes.REFERENCE) {
      var refcm = _this.meta.getMeta(pm.ref_class, null, ns);
      var refkey = refcm.getPropertyMeta(refcm.getKeyProperties()[0]);

      if (refkey) {
        return castValue(value, refkey, ns);
      }
      return value;
    }

    if (pm.type === PropertyTypes.STRING && value !== null) {
      return value;
    }
    switch (pm.type){
      case PropertyTypes.BOOLEAN: {
        if (value === 'false') {
          return false;
        } else {
          return Boolean(value);
        }
      }break;
      case PropertyTypes.DATETIME: return value ? new Date(value) : null;
      case PropertyTypes.REAL:
      case PropertyTypes.DECIMAL: {
        value = parseFloat(value);
        return isNaN(value) ? null : value;
      }break;
      case PropertyTypes.SET:
      case PropertyTypes.INT: {
        value = parseInt(value);
        return isNaN(value) ? null : value;
      }break;
    }
    return value;
  }

  /* Пока функционал заблокирован - вопрос нужно ли вообще редактирование коллекций через EditItem
    function processManyToManyCollection(backColCm,backColPropertyName,value,newId,oldId) {
      return new Promise(function (resolve, reject) {
        var filter = {};
        filter[backColPropertyName] = {$elemMatch: {$eq: oldId}};
        _this.getList(backColCm.getName(), {
          filter: filter
        }).then(function (results) {
          var edits, promises, newElements;
          promises = [];
          newElements = value.slice(0);
          for (var i = 0; i < results.length; i++) {
            var arrIndex = newElements.indexOf(results[i].getItemId());
            if (arrIndex < 0) {
              var backCol = results[i].get(backColPropertyName);
              if (backCol) {
                backCol.splice(backCol.indexOf(oldId), 1);
                edits = {};
                edits[backColPropertyName] = backCol;
                promises.push(
                  _this.ds.update(
                    tn(backColCm),
                    _this.keyProvider.keyToData(backColCm.getName(), results[i].getItemId()),
                    edits
                  )
                );
              }
            } else if (newId === oldId) {
              newElements.splice(arrIndex, 1);
            }
          }
          if (newElements.length) {
            filter = {};
            filter[backColCm.getKeyProperties()[0]] = {$in: newElements};
            _this.getList(backColCm.getName(), {
              filter: filter
            }).then(function (newResults) {
              for (var i = 0; i < newResults.length; i++) {
                var backCol = newResults[i].get(backColPropertyName);
                if (!backCol) {
                  backCol = [];
                } else if (newId !== oldId) {
                  backCol.splice(backCol.indexOf(oldId), 1);
                }
                backCol.push(newId);
                edits = {};
                edits[backColPropertyName] = backCol;
                promises.push(
                  _this.ds.update(
                    tn(backColCm),
                    _this.keyProvider.keyToData(backColCm.getName(), newResults[i].getItemId()),
                    edits
                  )
                );
              }
              Promise.all(promises).then(function (promiseResults) {
                resolve(value);
              }).catch(reject);
            }).catch(reject);
          } else {
            Promise.all(promises).then(function (promiseResults) {
              resolve(value);
            }).catch(reject);
          }
        }).catch(reject);
      });
    }

    function processCollection(cm, pm, collection, newId, oldId) {
      return new Promise(function (resolve, reject) {
        var ccm = _this.meta.getMeta(pm.items_class);
        var filter;
        if (ccm) {
          if (pm.back_ref) {
            filter = {};
            filter[pm.back_ref] = {$eq: oldId};
            _this.getList(pm.items_class, {
              filter: filter
            }).then(function (results) {
              var edits, promises;
              promises = [];
              for (var i = 0; i < results.length; i++) {
                var arrIndex = collection.indexOf(results[i].getItemId());
                if (arrIndex < 0) {
                  edits = {};
                  edits[pm.back_ref] = null;
                  promises.push(
                    _this.ds.update(
                      tn(ccm),
                      _this.keyProvider.keyToData(pm.items_class, results[i].getItemId()),
                      edits
                    )
                  );
                } else if (newId === oldId) {
                  collection.splice(arrIndex, 1);
                }
              }
              for (var j = 0; j < collection.length; j++) {
                edits = {};
                edits[pm.back_ref] = newId;
                promises.push(
                  _this.ds.update(
                    tn(ccm),
                    _this.keyProvider.keyToData(pm.items_class, collection[j]),
                    edits
                  )
                );
              }
              Promise.all(promises).then(function (rs) {
                resolve({property: pm.name, value: null});
              }).catch(reject);
            }).catch(reject);
          } else if (pm.back_coll) {
            processManyToManyCollection(ccm, pm.back_coll, collection, newId, oldId)
              .then(function (value) {
                resolve({property: pm.name, value: value});
              }).catch(reject);
          } else {
            var ccmPropertyMetas = ccm.getPropertyMetas();
            var backColProperty = null;
            for (var i = 0; i < ccmPropertyMetas.length; i++) {
              if (ccmPropertyMetas[i].type === PropertyTypes.COLLECTION &&
                ccmPropertyMetas[i].items_class === cm.getName() &&
                ccmPropertyMetas[i].back_coll === pm.name) {
                backColProperty = ccmPropertyMetas[i];
              }
            }
            if (backColProperty) {
              processManyToManyCollection(ccm, backColProperty.name, collection, newId, oldId)
                .then(function (value) {
                  resolve({property: pm.name, value: value});
                }).catch(reject);
            } else {
              resolve({property: pm.name, value: collection});
            }
          }
        } else {
          resolve({property: pm.name, value: collection});
        }
      });
    }

    /**
     * @param {{}} data
     * @param {Item} item
     * @param {String} oldId
     *
    function updateCollections(data, item, oldId) {
      var cm, pm, nm, promises;
      cm = item.getMetaClass();
      promises = [];
      for (nm in data) {
        if (data.hasOwnProperty(nm)) {
          pm = cm.getPropertyMeta(nm);
          if (pm) {
            if (pm.type === PropertyTypes.COLLECTION && pm.items_class) {
              promises.push(processCollection(cm, pm, data[nm], item.getItemId(), oldId));
            }
          }
        }
      }
      return new Promise(function (resolve, reject) {
        Promise.all(promises).then(
          function (results) {
            var updates = {};
            for (var i = 0; i < results.length; i++) {
              updates[results[i].property] = results[i].value;
            }
            _this.ds.update(
              tn(item.getMetaClass()),
              _this.keyProvider.keyToData(item.getClassName(), item.getItemId()),
              updates
            ).then(function (newItemData) {
              var item = _this._wrap(newItemData._class, newItemData, newItemData._classVer);
              resolve(item);
            });
          }).catch(reject);
      });
    }
  */
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
          } else if (pm.default_value) {
            try {
              switch (pm.type) {
                case PropertyTypes.DATETIME: {
                  updates[pm.name] = new Date(pm.default_value); // TODO Использовать moment
                }break;
                case PropertyTypes.INT: {
                  updates[pm.name] = parseInt(pm.default_value);
                }break;
                case PropertyTypes.REAL:
                case PropertyTypes.DECIMAL: {
                  updates[pm.name] = parseFloat(pm.default_value);
                }break;
                default: {
                  updates[pm.name] = pm.default_value;
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
              return _this.ds.upsert(tn(rcm), conditions, updates);
            } else {
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
   * @param {Item} item
   * @param {String[]} collections
   * @param {Item} detail
   * @param {String} action
   * @returns {Promise}
   */
  function editCollections(item, collections, detail, action) {
    return new Promise(function (resolve, reject) {
      _this._getItem(item.getMetaClass().getCanonicalName(), item.getItemId(), 0).
      then(function (m) {
        if (m) {
          var cond = formUpdatedData(
            m.getMetaClass(),
            _this.keyProvider.keyToData(
              m.getMetaClass().getName(),
              m.getItemId(),
              m.getMetaClass().getNamespace())
          );
          var updates = {};
          var src;
          for (var i = 0; i < collections.length; i++) {
            src = m.base[collections[i]] || [];
            if (action === 'eject') {
              src.splice(src.indexOf(detail.getItemId()), 1);
            } else if (src.indexOf(detail.getItemId()) < 0) {
              src.push(detail.getItemId());
            }
            updates[collections[i]] = src;
          }
          var mrcm = this._getRootType(m.getMetaClass());
          _this.ds.update(tn(mrcm), cond, updates).then(function () {
            resolve();
          }).catch(reject);
        } else {
          reject(new Error('Не найден контейнер коллекции!'));
        }
      }).
      catch(reject);
    });
  }

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item} detail
   * @param {ChangeLogger} [changeLogger]
   * @returns {Promise}
   */
  this._put = function (master, collection, detail, changeLogger) {
    return new Promise(function (resolve, reject) {
      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      if (pm.back_ref) {
        var update = {};
        update[pm.back_ref] = pm.binding ? master.get(pm.binding) : master.getItemId();
        _this._editItem(detail.getMetaClass().getCanonicalName(), detail.getItemId(), update).then(
          function (d) {
            resolve();
          }
        ).catch(reject);
      } else {
        editCollections(master, [collection], detail, 'put').
        then(function () {
          var props = detail.getMetaClass().getPropertyMetas();
          var backColls = [];
          for (var i = 0; i < props.length; i++) {
            if (props[i].type === PropertyTypes.COLLECTION && props[i].back_coll === collection) {
              backColls.push(props[i].name);
            }
          }
          if (backColls.length === 0) {
            return new Promise(function (r) {r();});
          }
          return editCollections(detail, backColls, master, 'put');
        }).then(function () {
          if (changeLogger) {
            var updates = {};
            updates[collection] = {
              className: detail.getMetaClass().getCanonicalName(),
              id: detail.getItemId()
            };
            changeLogger.LogChange(
              EventType.PUT,
              master.getMetaClass().getCanonicalName(),
              master.getItemId(),
              updates);
          } else {
            resolve();
          }
        }).catch(reject);
      }
    });
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item} detail
   * @param {ChangeLogger} [changeLogger]
   * @returns {Promise}
   */
  this._eject = function (master, collection, detail, changeLogger) {
    return new Promise(function (resolve, reject) {
      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      if (pm.back_ref) {
        var update = {};
        update[pm.back_ref] = null;
        _this._editItem(detail.getMetaClass().getCanonicalName(), detail.getItemId(), update).then(
          function (d) {
            resolve();
          }
        ).catch(reject);
      } else {
        editCollections(master, [collection], detail, 'eject').
        then(function () {
          var props = detail.getMetaClass().getPropertyMetas();
          var backColls = [];
          for (var i = 0; i < props.length; i++) {
            if (props[i].type === PropertyTypes.COLLECTION && props[i].back_coll === collection) {
              backColls.push(props[i].name);
            }
          }
          if (backColls.length === 0) {
            return new Promise(function (r) {r();});
          }
          return editCollections(detail, backColls, master, 'eject');
        }).then(function () {
          if (changeLogger) {
            var updates = {};
            updates[collection] = {
              className: detail.getMetaClass().getCanonicalName(),
              id: detail.getItemId()
            };
            changeLogger.LogChange(
              EventType.EJECT,
              master.getMetaClass().getCanonicalName(),
              master.getItemId(),
              updates);
          } else {
            resolve();
          }
        }).catch(reject);
      }
    });
  };

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
    return new Promise(function (resolve, reject) {
      if (!options) {
        options = {};
      }

      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      var detailCm = _this.meta.getMeta(pm.items_class, null, master.getMetaClass().getNamespace());
      if (!detailCm) {
        return reject(new Error('Не найден класс элементов коллекции!'));
      }

      if (pm.back_ref) {
        var filter = {};
        filter[pm.back_ref] = pm.binding ? master.get(pm.binding) : master.getItemId();
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
            _this._getList(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
          } else {
            reject(new Error('Не найден контейнер коллекции!'));
          }
        }).catch(reject);
      }
    });
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {{filter: Object}} [options]
   * @returns {Promise}
   */
  this._getAssociationsCount = function (master, collection, options) {
    return new Promise(function (resolve, reject) {
      if (!options) {
        options = {};
      }

      var pm = master.getMetaClass().getPropertyMeta(collection);
      if (!pm) {
        return reject(new Error('Не найден атрибут коллекции ' + master.getClassName() + '.' + collection));
      }

      var detailCm = _this.meta.getMeta(pm.items_class, null, master.getMetaClass().getNamespace());
      if (!detailCm) {
        return reject(new Error('Не найден класс элементов коллекции!'));
      }

      if (pm.back_ref) {
        var filter = {};
        filter[pm.back_ref] = pm.binding ? master.get(pm.binding) : master.getItemId();
        options.filter = options.filter ? {$and: [options.filter, filter]} : filter;
        _this._getCount(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
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
            _this._getCount(detailCm.getCanonicalName(), options).then(resolve).catch(reject);
          } else {
            reject(new Error('Не найден контейнер коллекции!'));
          }
        }).catch(reject);
      }
    });
  };
}

IonDataRepository.prototype = new DataRepository();
module.exports = IonDataRepository;
