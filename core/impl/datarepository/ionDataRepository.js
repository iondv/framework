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

/**
 * @param {DataSource} datasource
 * @param {MetaRepository} metarepository
 * @param {KeyProvider} keyProvider
 * @constructor
 */
function IonDataRepository(datasource, metarepository, keyProvider) {
  var _this = this;
  /**
   * @type {DataSource}
   */
  this.ds = datasource;

  /**
   * @type {MetaRepository}
   */
  this.meta = metarepository;

  /**
   * @type {KeyProvider}
   */
  this.keyProvider = keyProvider;

  this.namespaceSeparator = '__';

  /**
   *
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
    return new Promise(function (resolve, reject) { resolve(); });
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
    var descendants = this.meta.listMeta(cm.getName(), cm.getVersion(), false, cm.getNamespace());
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
        if (item.base.hasOwnProperty(nm)) {
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
    return new Item(this.keyProvider.formKey(acm.getName(), data, acm.getNamespace()), data, acm, this);
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
   *
   * @param {Array} src
   * @param {Number} depth
   * @returns {Promise}
   */
  function enrich(src, depth) {
    // TODO collections enrichment
    /*
    * Тут начинается космос, который еще до конца не сложился в голове
    * надо перебрать все объекты из src и сформировать промисы на получение связанных объектов  по каждому ссылочному атрибуту,
    * с учетом дочерних классов. Далее объединить эти промисы в all, и результаты как-то сопоставить с атрибутами,
    * после чего распределить объекты по ссылкам в исходном масиве
    *
    * */

    var i, nm, v, attrs, item, props, refc, promises, filter;

    attrs = {};
    promises = [];
    if (depth <= 0) {
      return new Promise(function (resolve, reject) {
        resolve(src);
      });
    }

    for (i = 0; i < src.length; i++) {
      item = src[i];
      props = item.getProperties();
      for (nm in props) {
        if (props.hasOwnProperty(nm)) {
          if (props[nm].getType() === PropertyTypes.REFERENCE) {
            refc = _this.meta.getMeta(props[nm].meta.ref_class, null, item.classMeta.getNamespace());
            if (refc) {
              if (!attrs.hasOwnProperty(item.classMeta.getName() + '.' + nm)) {
                attrs[item.classMeta.getName() + '.' + nm] = {
                  type: PropertyTypes.REFERENCE,
                  refClassName: refc.getCanonicalName(),
                  attrName: nm,
                  key: refc.getKeyProperties()[0],
                  pIndex: 0,
                  filter: []
                };
              }

              v = item.get(nm);
              if (v) {
                attrs[item.classMeta.getName() + '.' + nm].filter.push(v);
                if (typeof src[i].references === 'undefined') {
                  src[i].references = {};
                }
              }
            }
          }
          if (props[nm].getType() === PropertyTypes.COLLECTION && props[nm].meta.eager_loading) {
            refc = _this.meta.getMeta(props[nm].meta.items_class, null, item.classMeta.getNamespace());
            if (refc) {
              if (!attrs.hasOwnProperty(item.classMeta.getName() + '.' + nm)) {
                attrs[item.classMeta.getName() + '.' + nm] = {
                  type: PropertyTypes.COLLECTION,
                  colClassName: refc.getCanonicalName(),
                  attrName: nm,
                  key: refc.getKeyProperties()[0],
                  backRef: props[nm].meta.back_ref,
                  pIndex: 0,
                  colItems: []
                };
              }

              if (props[nm].meta.back_ref && !props[nm].meta.back_coll) {
                attrs[item.classMeta.getName() + '.' + nm].colItems.push(item.getItemId());
              } else {
                v = item.get(nm);
                if (v) {
                  attrs[item.classMeta.getName() + '.' + nm].colItems =
                    attrs[item.classMeta.getName() + '.' + nm].colItems.concat(v);
                }
              }
              if (typeof src[i].collections === 'undefined') {
                src[i].collections = [];
              }
            }
          }
        }
      }
    }

    promises = [];

    i = 0;
    for (nm in attrs) {
      if (attrs.hasOwnProperty(nm)) {
        if (attrs[nm].type  === PropertyTypes.REFERENCE) {
          attrs[nm].pIndex = i;
          i++;
          filter = {};
          filter[attrs[nm].key] = {$in: attrs[nm].filter};
          promises.push(_this.getList(attrs[nm].refClassName, {
            filter: filter,
            nestingDepth: depth - 1
          })); // Вот здесь ВНЕЗАПНО начинается рекурсия
        }
        if (attrs[nm].type  === PropertyTypes.COLLECTION) {
          attrs[nm].pIndex = i;
          i++;
          filter = {};
          if (attrs[nm].backRef) {
            filter[attrs[nm].backRef] = {$in: attrs[nm].colItems};
          } else {
            filter[attrs[nm].key] = {$in: attrs[nm].colItems};
          }
          promises.push(_this.getList(attrs[nm].colClassName, {
            filter: filter,
            nestingDepth: depth - 1
          }));
        }
      }
    }

    if (promises.length === 0) {
      return new Promise(function (resolve, reject) {
        resolve(src);
      });
    }

    return new Promise(function (resolve, reject) {
      Promise.all(promises).then(
        function (results) {
          var nm, items, itemsByKey, srcByKey, ids, i;
          for (nm in attrs) {
            if (attrs.hasOwnProperty(nm)) {
              if (attrs[nm].type === PropertyTypes.REFERENCE) {
                items = results[attrs[nm].pIndex];
                itemsByKey = {};
                for (i = 0; i < items.length; i++) {
                  itemsByKey[items[i].getItemId()] = items[i];
                }

                if (Object.getOwnPropertyNames(itemsByKey).length > 0) {
                  for (i = 0; i < src.length; i++) {
                    if (itemsByKey.hasOwnProperty(src[i].base[attrs[nm].attrName])) {
                      src[i].references[attrs[nm].attrName] = itemsByKey[src[i].base[attrs[nm].attrName]];
                    }
                  }
                }
              }

              if (attrs[nm].type === PropertyTypes.COLLECTION) {
                if (attrs[nm].backRef) {
                  items = results[attrs[nm].pIndex];
                  srcByKey = {};

                  for (i = 0; i < src.length; i++) {
                    srcByKey[src[i].getItemId()] = src[i];
                  }

                  if (Object.getOwnPropertyNames(srcByKey).length > 0) {
                    for (i = 0; i < items.length; i++) {
                      if (srcByKey.hasOwnProperty(items[i].base[attrs[nm].backRef])) {
                        if (typeof srcByKey[items[i].base[attrs[nm].backRef]].
                            collections[attrs[nm].attrName] === 'undefined') {
                          srcByKey[items[i].base[attrs[nm].backRef]].collections[attrs[nm].attrName] = [];
                        }
                        srcByKey[items[i].base[attrs[nm].backRef]].collections[attrs[nm].attrName].push(items[i]);
                      }
                    }
                  }
                } else {
                  items = results[attrs[nm].pIndex];
                  itemsByKey = {};
                  for (i = 0; i < items.length; i++) {
                    itemsByKey[items[i].getItemId()] = items[i];
                  }
                  if (Object.getOwnPropertyNames(itemsByKey).length > 0) {
                    for (i = 0; i < src.length; i++) {
                      ids = src[i].get(attrs[nm].attrName);
                      if (ids) {
                        for (i = 0; i < ids.length; i++) {
                          if (itemsByKey.hasOwnProperty(ids[i])) {
                            if (typeof src[i].collections[attrs[nm].attrName] === 'undefined') {
                              src[i].collections[attrs[nm].attrName]  = [];
                            }
                            src[i].collections[attrs[nm].attrName].push(itemsByKey[ids[i]]);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          console.log(src);
          resolve(src);
        }
      ).catch(reject);
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
      _this.ds.fetch(rcm.getName(), options).
        then(function (data) {
          try {
            for (var i = 0; i < data.length; i++) {
              result[i] = _this._wrap(data[i]._class, data[i], data[i]._classVer);
            }
          } catch (err) {
            return reject(err);
          }

          if (typeof data.total !== 'undefined' && data.total !== null) {
            result.total = data.total;
          }
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
        _this.ds.get(tn(rcm), _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace())).
        then(function (data) {
          var result = [];
          if (data) {
            result.push(_this._wrap(data._class, data, data._classVer));
          }
          try {
            return enrich(result, nestingDepth ? nestingDepth : 0);
          } catch (err) {
            reject(err);
          }
        }).then(function (items) { resolve(items[0]); }).catch(reject);
      });
    } else {
      var options = {};
      options.filter = this._addFilterByItem({}, obj);
      options.filter = this._addDiscriminatorFilter(options.filter, cm);
      options.count = 1;
      return new Promise(function (resolve, reject) {
        _this.ds.fetch(tn(rcm), options).then(function (data) {
          var result = [];
          for (var i = 0; i < data.length; i++) {
            result[i] = _this._wrap(data[i]._class, data[i], data[i]._classVer);
          }
          return enrich(result);
        }).then(function (items) { resolve(items[0]); }).catch(reject);
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

  /**
   *
   * @param {*} value
   * @param {{ type: Number, ref_class: String }} pm
   * @param {String} ns
   * @returns {*}
     */
  this._castValue = function(value, pm, ns) {
    if (pm.type === PropertyTypes.REFERENCE) {
      var refcm = this.meta.getMeta(pm.ref_class, ns);
      var refkey = refcm.getPropertyMeta(refcm.getKeyProperties()[0]);
      if (refkey) {
        return this._castValue(value, refkey);
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
      case PropertyTypes.DATETIME: return new Date(value);
      case PropertyTypes.REAL:
      case PropertyTypes.DECIMAL: return parseFloat(value);
      case PropertyTypes.SET:
      case PropertyTypes.INT: return parseInt(value);
    }
    return value;
  };

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
          data[nm] = _this._castValue(data[nm], pm, cm.getNamespace());
          updates[nm] = data[nm];
        }
      }
    }
    return updates;
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
        for (var i = 0;  i < properties.length; i++) {
          pm = properties[i];
          if (pm.autoassigned) {
            switch (pm.type) {
              case PropertyTypes.GUID: {
                updates[pm.name] = uuid.v1();
              }break;
              case PropertyTypes.DATETIME: {
                updates[pm.name] = new Date();
              }break;
              case PropertyTypes.INT: {
                updates[pm.name] = null;
                // TODO Implement autoincrement
              }break;
            }
          } else if (pm.default_value) {
            try {
              switch (pm.type) {
                case PropertyTypes.DATETIME: {
                  updates[pm.name] = new Date(pm.default_value);
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
        updates._class = cm.getCanonicalName();
        updates._classVer = cm.getVersion();

        _this.ds.insert(tn(rcm), updates).then(function (data) {
          var item = _this._wrap(data._class, data, data._classVer);
          if (changeLogger) {
            return new Promise(function (resolve, reject) {
              changeLogger.LogChange(
                EventType.CREATE,
                item.getMetaClass().getCanonicalName(),
                item.getItemId(),
                updates
              ).then(function (record) {
                resolve([item]);
              }).catch(reject);
            });
          } else {
            return new Promise(function (resolve, reject) {
              resolve([item]);
            });
          }
        }).then(function (items) {
          return enrich(items, nestingDepth !== null ? nestingDepth : 1);
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

        var updates = formUpdatedData(cm, data);

        /**
         * @var {{}}
         */
        var conditions = _this.keyProvider.keyToData(rcm.getName(), id);

        if (conditions) {
          _this.ds.update(tn(rcm), conditions, updates).then(function (data) {
            var item = _this._wrap(data._class, data, data._classVer);
            if (changeLogger) {
              return new Promise(function (resolve, reject) {
                changeLogger.LogChange(
                  EventType.UPDATE,
                  item.getMetaClass().getCanonicalName(),
                  item.getItemId(),
                  updates
                ).then(function (record) {
                  resolve([item]);
                }).catch(reject);
              });
            } else {
              return new Promise(function (resolve, reject) {
                resolve([item]);
              });
            }
          }).then(function (items) {
            return enrich(items, nestingDepth !== null ? nestingDepth : 1);
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
      try {
        var cm = _this.meta.getMeta(classname, version);
        var rcm = _this._getRootType(cm);

        var updates = formUpdatedData(cm, data);
        var conditions;
        if (id) {
          conditions = _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace());
        } else {
          conditions = _this.keyProvider.keyData(rcm.getName(), updates, rcm.getNamespace());
        }

        updates._class = cm.getName();
        updates._classVer = cm.getVersion();

        _this.ds.upsert(tn(rcm), conditions, updates).then(function (data) {
          var item = _this._wrap(data._class, data, data._classVer);
          if (changeLogger) {
            return new Promise(function (resolve, reject) {
              changeLogger.LogChange(
                EventType.UPDATE, // TODO Определять факт создания объекта
                item.getMetaClass().getCanonicalName(),
                item.getItemId(),
                updates
              ).then(function (record) {
                resolve([item]);
              }).catch(reject);
            });
          } else {
            return new Promise(function (resolve, reject) {
              resolve([item]);
            });
          }
        }).then(function (items) {
          return enrich(items, nestingDepth !== null ? nestingDepth : 1);
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
   * @param {ChangeLogger} [changeLogger]
   */
  this._deleteItem = function (classname, id, changeLogger) {
    var cm = _this.meta.getMeta(classname);
    var rcm = _this._getRootType(cm);

    return new Promise(function (resolve, reject) {
      _this.ds.delete(tn(rcm), _this.keyProvider.keyToData(rcm.getName(), id, rcm.getNamespace())).then(function () {
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
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item} detail
   * @param {ChangeLogger} [changeLogger]
   * @returns {Promise}
   */
  this._put = function (master, collection, detail, changeLogger) {
    var mrcm = this._getRootType(master.classMeta);
    var colProp = master.ClassMeta.getPropertyMeta(collection);
    if (colProp.back_ref) {
      var update = {};
      update[colProp.back_ref] = master.getItemId();
      return this.EditItem(detail.classMeta.getCanonicalName(), detail.getItemId(), update, changeLogger);
    }
    return new Promise(function (resolve, reject) {
        _this.ds.get(tn(mrcm), master.getItemId()).then(
          function (mdata) {
            if (!mdata[collection]) {
              mdata[collection] = [];
            }
            mdata[collection][mdata[collection].length] = detail.getItemId();
            _this.ds.update(
              tn(mrcm),
              _this.keyProvider.keyToData(mrcm.getName(), master.getItemId(), mrcm.getNamespace()),
              mdata).
            then(
              function (mdata) {
                if (changeLogger) {
                  var updates = {};
                  updates[collection] = {
                    className: detail.metaClass.getCanonicalName(),
                    id: detail.getItemId()
                  };
                  changeLogger.LogChange(
                    EventType.PUT,
                    master.classMeta.getCanonicalName(),
                    master.getItemId(),
                    updates);
                } else {
                  resolve();
                }
              }
            ).catch(reject);
          }
        ).catch(reject);
      }
    );
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
    var mrcm = this._getRootType(master.classMeta);
    var colProp = master.ClassMeta.getPropertyMeta(collection);
    if (colProp.back_ref) {
      var update = {};
      update[colProp.back_ref] = null;
      return this.EditItem(detail.classMeta.getCanonicalName(), detail.getItemId(), update, changeLogger);
    }
    return new Promise(function (resolve, reject) {
        _this.ds.get(tn(mrcm), master.getItemId()).then(
          function (mdata) {
            if (mdata[collection]) {
              mdata[collection].splice(mdata[collection].indexOf(detail.getItemId()), 1);
              _this.ds.update(tn(mrcm),
                _this.keyProvider.keyToData(mrcm.getName(), master.getItemId(), mrcm.getNamespace()),
                mdata).
                then(
                function (mdata) {
                  if (changeLogger) {
                    var updates = {};
                    updates[collection] = {
                      className: detail.metaClass.getCanonicalName(),
                      id: detail.getItemId()
                    };
                    changeLogger.LogChange(
                      EventType.EJECT,
                      master.classMeta.getCanonicalName(),
                      master.getItemId(),
                      updates);
                  } else {
                    resolve();
                  }
                }
              ).catch(reject);
            } else {
              resolve();
            }
          }
        ).catch(reject);
      }
    );
  };

  /**
   *
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
    var mrcm = this._getRootType(master.classMeta);
    var drcm = this._getRootType(
      this.meta.getMeta(master.classMeta.getPropertyMeta(collection).items_class, null, master.classMeta.getNamespace())
    );
    return new Promise(function (resolve, reject) {
      _this.ds.get(tn(mrcm), _this.keyProvider.keyToData(mrcm.getName(), master.getItemId(), mrcm.getNamespace())).
        then(function (mdata) {
          if (mdata[collection]) {
            var idf = {_id: {$in: mdata[collection]}};
            if (!options) {
              options = {};
            }
            options.filter = options.filter ? {$and: [options.filter,idf]} : idf;
            _this.ds.fetch(tn(drcm), options).
              then(function (data) {
                var result = [];
                for (var i = 0; i < data.length; i++) {
                  result[i] = _this._wrap(data[i]._class, data[i], data[i]._classVer);
                }
                return enrich(result, options.nestingDepth ? options.nestingDepth : 1);
              }).then(resolve).
              catch(reject);
          } else {
            resolve([]);
          }
        }).
        catch(reject);
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
    var mrcm = this._getRootType(master.classMeta);
    var drcm = this._getRootType(
      this.meta.getMeta(master.classMeta.getPropertyMeta(collection).items_class, master.classMeta.getNamespace())
    );
    return new Promise(function (resolve, reject) {
      _this.ds.get(tn(mrcm), _this.keyProvider.keyToData(mrcm.getName(), master.getItemId(), mrcm.getNamespace())).
        then(function (mdata) {
          if (mdata[collection]) {
            var idf = {_id: {$in: mdata[collection]}};
            if (!options) {
              options = {};
            }
            options.filter = options.filter ? {$and: [options.filter,idf]} : idf;
            _this.ds.count(tn(drcm), options).
              then(resolve).
              catch(reject);
          } else {
            resolve(0);
          }
        }).
        catch(reject);
    });
  };
}

IonDataRepository.prototype = new DataRepository();
module.exports = IonDataRepository;
