/**
 * Created by krasilneg on 22.12.16.
 */
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const Item = DataRepositoryModule.Item;
const CacheProxy = require('core/impl/cache/CacheProxy');
const loadFiles = require('core/interfaces/DataRepository/lib/util').loadFiles;
const calcProperties = require('core/interfaces/DataRepository/lib/util').calcProperties;
const crypto = require('crypto');
const clone = require('clone');

/* jshint maxstatements: 100, maxcomplexity: 100, maxdepth: 30 */

/**
 * @param {{}} options
 * @param {DataRepository} options.data
 * @param {Repository} options.cache
 * @param {MetaRepository} options.meta
 * @param {ResourceStorage} options.fileStorage
 * @param {String[]} [options.cachedClasses]
 * @constructor
 */
function CachedDataRepository(options) {

  var _this = this;

  /**
   * @type {DataRepository}
   */
  var dataRepo = options.data;

  /**
   * @type {ResourceStorage}
   */
  var fileStorage = options.fileStorage;

  /**
   * @type {ResourceStorage}
   */
  var imageStorage = options.imageStorage || fileStorage;

  /**
   * @type {Repository}
   */
  var cache = options.cache || new CacheProxy();

  function isCached(className) {
    if (!Array.isArray(options.cachedClasses) || !options.cachedClasses.length) {
      return true;
    }
    return options.cachedClasses.indexOf(className) >= 0;
  }

  function objectToMD5(object) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
  }

  function cacheList(className, options, list) {
    let p = Promise.resolve();
    if (!isCached(className)) {
      return p;
    }
    let listId = 'l:' + className + ':' + objectToMD5(options);
    let l = [];
    list.forEach((item) => {
      l.push({className: item.getClassName(), id: item.getItemId()});
      p = p.then(() => cacheItem(item));
    });
    return p
      .then(() => cache.set(listId, {items: l, total: list.total}))
      .then(() => cache.get('ll:' + className))
      .then((lists) => {
        lists = lists || [];
        lists.push(listId);
        return cache.set('ll:' + className, lists);
      });
  }

  function uncacheList(className, options) {
    if (!isCached(className)) {
      return Promise.resolve(null);
    }
    let listId = 'l:' + className + ':' + objectToMD5(options);
    return cache.get(listId)
      .then((list) => {
        if (!list) {
          return null;
        }
        let p = Promise.resolve();
        let result = [];
        let processed = {};
        list.items.forEach((li) => {
          p = p
            .then(() => uncacheItem(li.className, li.id, processed))
            .then((item) => {
              if (item) {
                result.push(item);
              }
            });
        });
        result.total = list.total;
        return p.then(() => result);
      });
  }

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  function cacheItem(item, eagerLoaded, processed) {
    processed = processed || {};
    if (!eagerLoaded && !isCached(item.getClassName())) {
      return Promise.resolve();
    }

    processed[item.getClassName() + '@' + item.getItemId()] = true;
    return cache.get(item.getClassName() + '@' + item.getItemId())
      .then((existing) => {
        let refs = existing ? existing.references : {};
        let colls = existing ? existing.collections : {};
        let p = Promise.resolve();
        Object.keys(item.references)
          .forEach((nm) => {
            if (item.references[nm]) {
              refs[nm] = {
                className: item.references[nm].getClassName(),
                id: item.references[nm].getItemId()
              };
              if (!processed[item.references[nm].getClassName() + '@' + item.references[nm].getItemId()]) {
                p = p.then(() => cacheItem(item.references[nm], true, processed));
              }
            }
          });

        Object.keys(item.collections)
          .forEach((nm) => {
            if (item.collections[nm].length) {
              colls[nm] = [];
              item.collections[nm].forEach((tmp) => {
                colls[nm].push({
                  className: tmp.getClassName(),
                  id: tmp.getItemId()
                });
                if (!processed[tmp.getClassName() + '@' + tmp.getItemId()]) {
                  p = p.then(() => cacheItem(tmp, true, processed));
                }
              });
            }
          });

        return p.then(
          () => cache.set(
            item.getClassName() + '@' + item.getItemId(),
            {
              base: item.base,
              references: refs,
              collections: colls
            }
          )
        );
      });
  }

  function uncacheItem(className, id, processed, eagerLoaded) {
    if (className instanceof Item) {
      if (!id) {
        id = className.getItemId();
      }
      className = className.getClassName();
    }
    if (!eagerLoaded && !isCached(className)) {
      return Promise.resolve(null);
    }
    if (processed && processed.hasOwnProperty(className + '@' + id)) {
      return Promise.resolve(processed[className + '@' + id]);
    }
    return cache.get(className + '@' + id)
      .then((item) => {
        if (!item) {
          return null;
        }

        let result = _this._wrap(className, item.base);
        processed = processed || {};
        processed[className + '@' + id] = result;
        let p = Promise.resolve();

        Object.keys(item.references)
          .forEach(
            (nm) => {
              p = p
                .then(() => uncacheItem(item.references[nm].className, item.references[nm].id, processed, true))
                .then((ri) => {
                  result.references[nm] = ri;
                });
            }
          );

        Object.keys(item.collections)
          .forEach((nm) => {
            result.collections[nm] = [];
            item.collections[nm]
              .forEach((tmp) => {
                p = p
                  .then(() => uncacheItem(tmp.className, tmp.id, processed, true))
                  .then((item) => {
                    result.collections[nm].push(item);
                  });
              });
          });

        return p
          .then(() => loadFiles(result, fileStorage, imageStorage))
          .then(() => calcProperties(result));
      });
  }

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @param {{}} [options]
   * @private
   * @returns {Item | null}
   */
  this._wrap = function (className, data, version, options) {
    return dataRepo.wrap(className, data, version, options);
  };

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object, uid: String}} options
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    return dataRepo.getCount(obj, options);
  };

  /**
   * @param {String | Item} obj
   * @param {{uid: String}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @returns {Promise}
   */
  this._getList = function (obj, options) {
    let opts = clone(options);
    return uncacheList(obj, opts)
      .then((list) => {
        if (list) {
          return list;
        }

        return dataRepo.getList(obj, options)
          .then((list) => {
            if (!list) {
              return list;
            }
            return cacheList(obj, opts, list).then(() => list);
          });
      });
  };

  /**
   * @param {String} className
   * @param {{uid: String}} options
   * @param {{}} [options.expressions]
   * @param {{}} [options.filter]
   * @param {{}} [options.groupBy]
   * @returns {Promise}
   */
  this._aggregate = function (className, options) {
    return dataRepo.aggregate(className, options);
  };

  /**
   *
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{uid: String}} options
   * @param {Number} [options.nestingDepth]
   */
  this._getItem = function (obj, id, options) {
    if (obj instanceof Item) {
      if (!options.reload) {
        return dataRepo.getItem(obj, id, options);
      }
    }
    return uncacheItem(obj, id)
      .then((item) => {
        if (item) {
          return item;
        }
        return dataRepo.getItem(obj, id, options).then(item => !item ? item : cacheItem(item).then(() => item));
      });
  };

  /**
   * @param {ClassMeta} cm
   * @returns {Function}
   */
  function cleanClassLists(cm) {
    return function () {
      return cache.get('ll:' + cm.getCanonicalName())
        .then((lists) => {
          let p = Promise.resolve();
          if (lists) {
            lists.forEach((listId) => {
              p = p.then(() => cache.set(listId, null));
            });
          }
          return p.then(() => cache.set('ll:' + cm.getCanonicalName(), null));
        });
    };
  }

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  function cleanLists(item) {
    if (!item) {
      return Promise.resolve();
    }
    let p = Promise.resolve();
    let cm = item.getMetaClass();
    while (cm) {
      p = p.then(cleanClassLists(cm));
      cm = cm.getAncestor();
    }
    return p.then(() => item);
  }

  /**
   *
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger | Function} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, options) {
    return dataRepo.createItem(classname, data, version, changeLogger, options).then(cleanLists);
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._editItem = function (classname, id, data, changeLogger, options) {
    return dataRepo.editItem(classname, id, data, changeLogger, options).then(cleanLists);
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.autoAssign]
   * @returns {Promise}
   */
  this._saveItem = function (classname, id, data, version, changeLogger, options) {
    return dataRepo.saveItem(classname, id, data, version, changeLogger, options).then(cleanLists);
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return dataRepo.getItem(classname, id)
      .then(cleanLists)
      .then(() => dataRepo.deleteItem(classname, id, changeLogger, options));
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._put = function (master, collection, details, changeLogger, options) {
    return dataRepo.put(master, collection, details, changeLogger, options);
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._eject = function (master, collection, details, changeLogger, options) {
    return dataRepo.eject(master, collection, details, changeLogger, options);
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{uid: String}} options
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this._getAssociationsList = function (master, collection, options) {
    return dataRepo.getAssociationsList(master, collection, options);
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {{uid: String}} options
   * @param {{}} [options.filter]
   * @returns {Promise}
   */
  this._getAssociationsCount = function (master, collection, options) {
    return dataRepo.getAssociationsCount(master, collection, options);
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipResult]
   * @param {String} [options.uid]
   * @returns {Promise}
   */
  this._bulkEdit = function (classname, data, options) {
    return dataRepo.bulkEdit(classname, data, options);
  };

  /**
   * @param {String} classname
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {String} [options.uid]
   * @returns {Promise}
   */
  this._bulkDelete = function (classname, options) {
    return dataRepo.bulkDelete(classname, options);
  };
}

CachedDataRepository.prototype = new DataRepository();
module.exports = CachedDataRepository;
