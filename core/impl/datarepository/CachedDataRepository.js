/**
 * Created by krasilneg on 22.12.16.
 */
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const CacheProxy = require('core/impl/cache/CacheProxy');
const crypto = require('crypto');

/* jshint maxstatements: 100, maxcomplexity: 100, maxdepth: 30 */

/**
 * @param {{}} options
 * @param {DataRepository} options.data
 * @param {CacheRepository} options.cache
 * @param {MetaRepository} options.meta
 * @constructor
 */
function CachedDataRepository(options) {

  var _this = this;

  /**
   * @type {DataRepository}
   */
  var dataRepo = options.data;

  /**
   * @type {CacheRepository}
   */
  var cache = options.cache || new CacheProxy();

  function objectToMD5(object) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
  }

  function cacheList(className, options, list) {
    var listId = 'l:' + className + ':' + objectToMD5(options);
    var l = [];
    for (var i = 0; i < list.length; i++) {
      l.push({className: list[i].getClassName(), id: list[i].getItemId()});
    }
    return cache.set(listId, l);
  }

  function uncacheNext(className, id, result) {
    return function () {
      return uncacheItem(className, id).then(function (item) {
        if (item) {
          result.push(item);
        }
        return Promise.resolve();
      });
    };
  }

  function uncacheList(className, options) {
    var listId = 'l:' + className + ':' + objectToMD5(options);
    return cache.get(listId)
      .then(function (list) {
        if (!list) {
          return Promise.resolve(null);
        }
        var p = null;
        var result = [];
        for (var i = 0; i < list.length; i++) {
          if (p) {
            p = p.then(uncacheNext(list[i].className, list[i].id, result));
          } else {
            p = uncacheNext(list[i].className, list[i].id, result)();
          }
        }
        if (p) {
          return p.then(function () {
            return Promise.resolve(result);
          });
        }
        return Promise.resolve(result);
      });
  }

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  function cacheItem(item) {
    return cache.set(item.getClassName() + '@' + item.getItemId(), item.base);
  }

  function uncacheItem(className, id) {
    return cache.get(className + '@' + id)
      .then(function (item) {
        if (!item) {
          return Promise.resolve(null);
        }
        return Promise.resolve(_this._wrap(className, item));
      });
  }

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @param {{autoassign: Boolean}} [options]
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
    return uncacheList(obj, options)
      .then(function (list) {
        if (list) {
          return Promise.resolve(list);
        }
        console.log('getting list from db for ', obj);
        return dataRepo.getList(obj, options)
          .then(function (list) {
            if (!list) {
              return Promise.resolve(list);
            }
            return cacheList(obj, options, list)
              .then(function () {
                return Promise.resolve(list);
              });
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
    return uncacheItem(obj, id)
      .then(function (item) {
        if (item) {
          return Promise.resolve(item);
        }
        return dataRepo.getItem(obj, id, options)
          .then(function (item) {
            if (!item) {
              return Promise.resolve(item);
            }
            return cacheItem(item)
              .then(function () {
                return Promise.resolve(item);
              });
          });
      });
  };

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
    return dataRepo.createItem(classname, data, version, changeLogger, options);
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
    return dataRepo.editItem(classname, id, data, changeLogger, options);
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
    return dataRepo.saveItem(classname, id, data, version, changeLogger, options);
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return dataRepo.deleteItem(classname, id, changeLogger, options);
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
}

CachedDataRepository.prototype = new DataRepository();
module.exports = CachedDataRepository;
