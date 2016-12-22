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
 * @param {CacheRepository} options.cacheRepository
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
  this.cache = options.cacheRepository || new CacheProxy();

  function objectToMD5(object) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
  }

  function cachingKey(classname, id) {
    return classname + '@@' + id;
  }

  function cachingKeyDecode(key) {
    var parts =  key.split('@@');
    return {classname: parts[0], id: parts[1]};
  }

  function cachingListKey(classname) {
    return '__' + classname;
  }

  function retrieveCachedList(classname, options) {
    var filterSortHash = objectToMD5({filter: options.filter, sort: options.sort});
    var offsetCount = (options.offset ? options.offset : '') + '_' + (options.count ? options.count : '');
    return _this.cache.get(classname + '@' + filterSortHash + '@' + offsetCount);
  }

  function updateListObjectInCache(key, payload) {
    return _this.cache.get(key)
        .then(
          function (data) {
            if (!data) {
              data = [];
            }

            if (data.indexOf(payload) < 0) {
              data.push(payload);
            }
            return _this.cache.set(key, data);
          }
        );
  }

  function putListToCache(classname, options, list) {
    var filterSortHash = objectToMD5({filter: options.filter,sort: options.sort});
    var offsetCount = (options.offset ? options.offset : '') + '_' + (options.count ? options.count : '');
    return updateListObjectInCache(classname, filterSortHash + '@' + offsetCount)
        .then(function () {
          return _this.cache.set(classname + '@' + filterSortHash + '@' + offsetCount, list);
        });
  }

  function uncacheItem(classname, id) {
    return _this.cache.get(cachingKey(classname, id))
        .then(
          function (value) {
            if (value) {
              return Promise.resolve(_this._wrap(classname, value.base));
            } else {
              return Promise.resolve(null);
            }
          }
        );
  }

  function updateCachedItem(classname, id, data, list) {
    return _this.cache.get(cachingKey(classname, id))
        .then(
          function (value) {
            var result = {
              base: data,
              lists: []
            };
            if (value) {
              result.lists = value.lists;
            }
            if (list) {
              var push = true;
              for (var i = 0; i < result.lists.length; i++) {
                if (
                  result.lists[i].classname === list.classname &&
                  JSON.stringify(result.lists[i].options.filter) === JSON.stringify(list.options.filter) &&
                  JSON.stringify(result.lists[i].options.sort) === JSON.stringify(list.options.sort) &&
                  result.lists[i].options.offset === list.options.offset &&
                  result.lists[i].options.count === list.options.count
                ) {
                  push = false;
                }
              }
              if (push) {
                result.lists.push(list);
              }
            }
            return _this.cache.set(cachingKey(classname, id), result);
          }
        );
  }

  function unsetList(key) {
    return function () {
      return _this.cache.set(key, null);
    };
  }

  function removeCachedListsAfterCreate(classname) {
    return _this.cache.get(classname)
        .then(
          function (lists) {
            if (lists) {
              var p;
              for (var i = 0; i < lists.length; i++) {
                if (p) {
                  p = p.then(unsetList(classname + '@' + lists[i]));
                } else {
                  p = unsetList(classname + '@' + lists[i])();
                }
              }
              if (p) {
                return p.then(function () {
                  return _this.cache.set(classname, null);
                });
              }
              return _this.cache.set(classname, null);
            }
          }
        );
  }

  function removeCachedListsAfterUpdate(classname, id) {
    return _this.cache.get(cachingKey(classname, id))
        .then(function (value) {
          if (value) {
            var p, filterSortHash, offsetCount;
            for (var i = 0; i < value.lists.length; i++) {
              filterSortHash = objectToMD5(
                {
                  filter: value.lists[i].options.filter,
                  sort: value.lists[i].options.sort
                }
              );
              offsetCount = (value.lists[i].options.offset ? value.lists[i].options.offset : '') + '_' +
                (value.lists[i].options.count ? value.lists[i].options.count : '');
              if (p) {
                p = p.then(unsetList(classname + '@' + filterSortHash + '@' + offsetCount));
              } else {
                p = unsetList(classname + '@' + filterSortHash + '@' + offsetCount)();
              }
            }
            if (p) {
              return p;
            }
          }
          return Promise.resolve();
        });
  }

  function removeCachedListsAfterDelete(classname, id) {
    return _this.cache.get(cachingKey(classname, id))
        .then(function (value) {
          if (value) {
            var p, filterSortHash, offsetCount;
            for (var i = 0; i < value.lists.length; i++) {
              filterSortHash = objectToMD5({filter: value.lists[i].options.filter, sort: value.lists[i].options.sort});
              offsetCount = (value.lists[i].options.offset ? value.lists[i].options.offset : '') + '_' +
                (value.lists[i].options.count ? value.lists[i].options.count : '');
              
              
              if (p) {
                p = p.then(unsetList(classname + '@' + filterSortHash + '@' + offsetCount));
              } else {
                p = unsetList(classname + '@' + filterSortHash + '@' + offsetCount)();
              }
            }
            if (p) {
              return p;
            }
          }
          return Promise.resolve();
        });
  }

  function cacheList(classname, options, list) {
    var cacheObject = {
      itemIds: [],
      total: null
    };
    var promises = [];
    var item;
    var listId = {
      classname: cachingListKey(classname),
      options: options
    };

    for (var i = 0; i < list.length; i++) {
      item = list[i];
      cacheObject.itemIds.push(cachingKey(item.getClassName(), item.getItemId()));
      promises.push(updateCachedItem(item.getClassName(), item.getItemId(), item.base, listId));
    }

    if (typeof list.total !== 'undefined' && list.total !== null) {
      cacheObject.total = list.total;
    }

    return Promise.all(promises).then(function () {
      return putListToCache(cachingListKey(classname), options, cacheObject)
        .then(
          function () {
            return Promise.resolve(list);
          }
        ).catch(
          function () {
            return Promise.resolve(list);
          }
        );
    });
  }

  function itemGetter(key, items) {
    return function (item) {
      items.push(item.base);
      return uncacheItem(key.classname, key.id);
    };
  }

  function uncacheList(classname, options) {
    return retrieveCachedList(cachingListKey(classname), options)
      .then(
        function (listObject) {
          var items = [];
          if (listObject) {
            var p;
            var key;
            for (var i = 0; i < listObject.itemIds.length; i++) {
              key = cachingKeyDecode(listObject.itemIds[i]);
              if (p) {
                p = p.then(itemGetter(key, items));
              } else {
                p = uncacheItem(key.classname, key.id);
              }
            }
            if (p) {
              return p.then(function (item) {
                items.push(item);
                items.total = listObject.total;
                return Promise.resolve(items);
              });
            }
            return Promise.resolve([]);
          }
          return Promise.resolve(null);
        }
      );
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
    return dataRepo.getList(obj, options);
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
    return dataRepo.getItem(obj, id, options);
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
    return dataRepo.deleteItem(classname, id, changeLogger);
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
    return dataRepo.put(master, collection, details, changeLogger);
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
    return dataRepo.eject(master, collection, details, changeLogger);
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
