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
    return cache.get(classname + '@' + filterSortHash + '@' + offsetCount);
  }

  function updateListObjectInCache(key, payload) {
    return cache.get(key)
        .then(
          function (data) {
            if (!data) {
              data = [];
            }

            if (data.indexOf(payload) < 0) {
              data.push(payload);
            }
            return cache.set(key, data);
          }
        );
  }

  function putListToCache(classname, options, list) {
    var listId = objectToMD5({filter: options.filter,sort: options.sort}) + '@' +
      (options.offset ? options.offset : '') + '_' + (options.count ? options.count : '');
    return updateListObjectInCache(classname, {listId: listId, offset: options.offset})
      .then(function () {
        return cache.set(classname + '@' + listId, list);
      });
  }

  function uncacheItem(classname, id) {
    return cache.get(cachingKey(classname, id))
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
    return cache.get(cachingKey(classname, id))
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
            return cache.set(cachingKey(classname, id), result);
          }
        );
  }

  function unsetList(key) {
    return function () {
      return cache.set(key, null);
    };
  }

  function removeCachedListsAfterCreate(classname) {
    return cache.get(classname)
        .then(
          function (lists) {
            if (lists) {
              var p;
              for (var i = 0; i < lists.length; i++) {
                if (p) {
                  p = p.then(unsetList(classname + '@' + lists[i].listId));
                } else {
                  p = unsetList(classname + '@' + lists[i].listId)();
                }
              }
              if (p) {
                return p.then(function () {
                  return cache.set(classname, null);
                });
              }
              return cache.set(classname, null);
            }
          }
        );
  }

  function removeCachedListsAfterUpdate(classname, id) {
    return cache.get(cachingKey(classname, id))
        .then(function (value) {
          if (value) {
            var p, listId;
            for (var i = 0; i < value.lists.length; i++) {
              listId = objectToMD5(
                {
                  filter: value.lists[i].options.filter,
                  sort: value.lists[i].options.sort
                }
              ) + (value.lists[i].options.offset ? value.lists[i].options.offset : '') + '_' +
                (value.lists[i].options.count ? value.lists[i].options.count : '');

              if (p) {
                p = p.then(unsetList(value.lists[i].classname + '@' + listId));
              } else {
                p = unsetList(value.lists[i].classname + '@' + listId)();
              }
            }
            if (p) {
              return p;
            }
          }
          return Promise.resolve();
        });
  }

  function unsetListOffset(classname, offset) {
    return _this.cahce.get(classname).then(function (lists) {
      var p;
      for (var i = 0; i < lists.length; i++) {
        if (!offset || lists[i].offset >= offset) {
          if (p) {
            p = p.then(unsetList(classname + '@' + lists[i].listId));
          } else {
            p = unsetList(classname + '@' + lists[i].listId)();
          }
        }
      }
      if (p) {
        return p;
      }
      return Promise.resolve();
    });
  }

  function removeCachedListsAfterDelete(classname, id) {
    return cache.get(cachingKey(classname, id))
        .then(function (value) {
          if (value) {
            var p;
            for (var i = 0; i < value.lists.length; i++) {
              if (p) {
                p = p.then(unsetListOffset(classname, value.lists[i].options.offset));
              } else {
                p = unsetListOffset(classname, value.lists[i].options.offset)();
              }
            }
            if (p) {
              return p;
            }
          }
          return Promise.resolve();
        });
  }

  function updateNextCacheItem(item, listId) {
    return function () {
      return updateCachedItem(item.getClassName(), item.getItemId(), item.base, listId);
    };
  }

  function cacheList(classname, options, list) {
    var cacheObject = {
      itemIds: [],
      total: null
    };
    var p;
    var item;
    var listId = {
      classname: cachingListKey(classname),
      options: options
    };

    for (var i = 0; i < list.length; i++) {
      item = list[i];
      cacheObject.itemIds.push(cachingKey(item.getClassName(), item.getItemId()));
      if (p) {
        p = p.then(updateNextCacheItem(item, listId));
      } else {
        p = updateCachedItem(item.getClassName(), item.getItemId(), item.base, listId);
      }
    }

    if (typeof list.total !== 'undefined' && list.total !== null) {
      cacheObject.total = list.total;
    }

    if (p) {
      return p.then(function () {
        return putListToCache(listId.classname, options, cacheObject);
      });
    }

    return putListToCache(listId.classname, options, cacheObject);
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

  function uncacheCount(classname, options) {
    return retrieveCachedList(cachingListKey(classname), options)
      .then(
        function (listObject) {
          if (listObject) {
            return Promise.resolve(listObject.total);
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
    return uncacheCount(obj, options).then(function (total) {
      if (total) {
        return Promise.resolve(total);
      }
      return dataRepo.getCount(obj, options);
    });
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
            return updateCachedItem(item.getClassName(), item.getItemId(), item.base)
              .then(function () {
                return Promise.resolve(item);
              });
          });
      });
  };

  function removeAfterCreate(classname) {
    return function () {
      return removeCachedListsAfterCreate(classname);
    };
  }

  /**
   * @param {ClassMeta} cm
   * @returns {Promise}
   */
  function removeAfterCreateH(cm) {
    var p;
    while (cm) {
      if (p) {
        p = p.then(removeAfterCreate(cm.getCanonicalName()));
      } else {
        p = removeCachedListsAfterCreate(cm.getCanonicalName());
      }
      cm = cm.getAncestor();
    }
    return p;
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
    return dataRepo.createItem(classname, data, version, changeLogger, options)
      .then(function (result) {
        if (!result) {
          return Promise.resolve(result);
        }

        return removeAfterCreateH(result.getMetaClass()).then(function () {
          return updateCachedItem(result.getClassName(), result.getItemId(), result.base)
            .then(function () {
              return Promise.resolve(result);
            });
        });
      });
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
    return dataRepo.editItem(classname, id, data, changeLogger, options)
      .then(function (result) {
        if (!result) {
          return Promise.resolve(result);
        }
        return removeCachedListsAfterUpdate(classname, id).then(function () {
          return updateCachedItem(result.getClassName(), result.getItemId(), result.base)
            .then(function () {
              return Promise.resolve(result);
            });
        });
      });
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
    return dataRepo.saveItem(classname, id, data, version, changeLogger, options)
      .then(function (result) {
        if (!result) {
          return Promise.resolve(result);
        }

        return removeAfterCreateH(result.getMetaClass()).then(function () {
          return updateCachedItem(result.getClassName(), result.getItemId(), result.base)
            .then(function () {
              return Promise.resolve(result);
            });
        });
      });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return dataRepo.deleteItem(classname, id, changeLogger, options)
      .then(function () {
        return removeCachedListsAfterDelete(classname, id);
      })
      .then(function () {
        return cache.set(cachingKey(classname, id), null);
      });
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
