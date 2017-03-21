/**
 * Created by krasilneg on 22.12.16.
 */
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const CacheProxy = require('core/impl/cache/CacheProxy');
const loadFiles = require('core/interfaces/DataRepository/lib/util').loadFiles;
const calcProperties = require('core/interfaces/DataRepository/lib/util').calcProperties;
const crypto = require('crypto');
const clone = require('clone');

/* jshint maxstatements: 100, maxcomplexity: 100, maxdepth: 30 */

/**
 * @param {{}} options
 * @param {DataRepository} options.data
 * @param {CacheRepository} options.cache
 * @param {MetaRepository} options.meta
 * @param {ResourceStorage} options.fileStorage
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
   * @type {CacheRepository}
   */
  var cache = options.cache || new CacheProxy();

  function objectToMD5(object) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
  }

  function cacheNext(item) {
    return function () {
      return cacheItem(item);
    };
  }

  function cacheList(className, options, list) {
    var listId = 'l:' + className + ':' + objectToMD5(options);
    var l = [];
    var p = null;
    for (var i = 0; i < list.length; i++) {
      l.push({className: list[i].getClassName(), id: list[i].getItemId()});
      if (p) {
        p = p.then(cacheNext(list[i]));
      } else {
        p = cacheNext(list[i])();
      }
    }
    if (!p) {
      p = Promise.resolve();
    }
    return p.then(function () {
      return cache.set(listId, {items: l, total: list.total});
    }).then(function () {
      return cache.get('ll:' + className);
    }).then(function (lists) {
      lists = lists || [];
      lists.push(listId);
      return cache.set('ll:' + className, lists);
    });
  }

  function uncacheNext(className, id, result, processed) {
    return function () {
      return uncacheItem(className, id, processed).then(function (item) {
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
        var processed = {};
        for (var i = 0; i < list.items.length; i++) {
          if (p) {
            p = p.then(uncacheNext(list.items[i].className, list.items[i].id, result, processed));
          } else {
            p = uncacheNext(list.items[i].className, list.items[i].id, result, processed)();
          }
        }
        result.total = list.total;
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
    return cache.get(item.getClassName() + '@' + item.getItemId())
      .then(function (existing) {
        var nm, p;
        var refs = existing ? existing.references : {};
        var colls = existing ? existing.collections : {};

        for (nm in item.references) {
          if (item.references.hasOwnProperty(nm) && item.references[nm]) {
            refs[nm] = {
              className: item.references[nm].getClassName(),
              id: item.references[nm].getItemId()
            };
            if (p) {
              p = p.then(cacheNext(item.references[nm]));
            } else {
              p = cacheNext(item.references[nm])();
            }
          }
        }

        for (nm in item.collections) {
          if (item.collections.hasOwnProperty(nm) && item.collections[nm].length) {
            colls[nm] = [];
            for (let i = 0; i < item.collections[nm].length; i++) {
              colls[nm].push({
                className: item.collections[nm][i].getClassName(),
                id: item.collections[nm][i].getItemId()
              });
              if (p) {
                p = p.then(cacheNext(item.collections[nm][i]));
              } else {
                p = cacheNext(item.collections[nm][i])();
              }
            }
          }
        }

        if (p) {
          return p.then(function () {
            return cache.set(
              item.getClassName() + '@' + item.getItemId(),
              {base: item.base, references: refs, collections: colls}
            );
          });
        }
        return cache.set(
          item.getClassName() + '@' + item.getItemId(),
          {base: item.base, references: refs, collections: colls}
        );
      });
  }

  function uncacheRef(params, references, nm, processed) {
    return function () {
      return uncacheItem(params.className, params.id, processed).then(function (item) {
        references[nm] = item;
        return Promise.resolve();
      });
    };
  }

  function uncacheColItem(params, coll, processed) {
    return function () {
      return uncacheItem(params.className, params.id, processed).then(function (item) {
        coll.push(item);
        return Promise.resolve();
      });
    };
  }

  function uncacheItem(className, id, processed) {
    if (processed && processed.hasOwnProperty(className + '@' + id)) {
      return Promise.resolve(processed[className + '@' + id]);
    }
    return cache.get(className + '@' + id)
      .then(function (item) {
        if (!item) {
          return Promise.resolve(null);
        }

        var result = _this._wrap(className, item.base);
        processed = processed || {};
        processed[className + '@' + id] = result;
        var p, nm;
        for (nm in item.references) {
          if (item.references.hasOwnProperty(nm)) {
            if (p) {
              p = p.then(uncacheRef(item.references[nm], result.references, nm, processed));
            } else {
              p = uncacheRef(item.references[nm], result.references, nm, processed)();
            }
          }
        }

        for (nm in item.collections) {
          if (item.collections.hasOwnProperty(nm)) {
            result.collections[nm] = [];
            for (let i = 0; i < item.collections[nm].length; i++) {
              if (p) {
                p = p.then(uncacheColItem(item.collections[nm][i], result.collections[nm], processed));
              } else {
                p = uncacheColItem(item.collections[nm][i], result.collections[nm], processed)();
              }
            }
          }
        }

        if (!p) {
          p = Promise.resolve();
        }
        return p
          .then(function () {
            return loadFiles(result, fileStorage, imageStorage);
          })
          .then(function () {
            return calcProperties(result);
          });
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
    var opts = clone(options);
    return uncacheList(obj, opts)
      .then(function (list) {
        if (list) {
          return Promise.resolve(list);
        }

        return dataRepo.getList(obj, options)
          .then(function (list) {
            if (!list) {
              return Promise.resolve(list);
            }
            return cacheList(obj, opts, list)
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

  function cleanList(listId) {
    return function () {
      return cache.set(listId, null);
    };
  }

  /**
   * @param {ClassMeta} cm
   * @returns {Function}
   */
  function cleanClassLists(cm) {
    return function () {
      return cache.get('ll:' + cm.getCanonicalName())
        .then(function (lists) {
          var p;
          if (lists) {
            for (var i = 0; i < lists.length; i++) {
              if (p) {
                p = p.then(cleanList(lists[i]));
              } else {
                p = cleanList(lists[i])();
              }
            }
          }
          if (!p) {
            p = Promise.resolve();
          }
          return p.then(function () {
            return cache.set('ll:' + cm.getCanonicalName(), null);
          });
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
    var p;
    var cm = item.getMetaClass();
    while (cm) {
      if (p) {
        p = p.then(cleanClassLists(cm));
      } else {
        p = cleanClassLists(cm)();
      }
      cm = cm.getAncestor();
    }
    return p.then(function () {
      return Promise.resolve(item);
    });
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
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return dataRepo.getItem(classname, id)
      .then(cleanLists)
      .then(function () {
        return dataRepo.deleteItem(classname, id, changeLogger, options);
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

  /**
   * @param {String} classname
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipResult]
   * @param {String} [options.uid]
   * @param {{}} data
   * @returns {Promise}
   */
  this._bulkUpdate = function (classname, options, data) {
    return dataRepo.bulkUpdate(classname, options, data);
  };
}

CachedDataRepository.prototype = new DataRepository();
module.exports = CachedDataRepository;
