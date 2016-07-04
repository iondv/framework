// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 25.02.16.
 */
'use strict';

// var util = require('util'); //jscs:ignore requireSpaceAfterLineComments
var DataSource = require('core/interfaces/DataSource');
var mongo = require('mongodb');
var client = mongo.MongoClient;
var oid = mongo.ObjectID;
var debug = require('debug-log')('ION:db');
var assert = require('chai').assert;

/**
 * @param {{ uri: String, options: Object }} config
 * @constructor
 */
function MongoDs(config) {

  var _this = this;

  /**
   * @type {Db}
   */
  this.db = null;

  this.isOpen = false;

  this.busy = false;

  /**
   * @type {InsertPreprocessor}
   */
  this.insertPreprocessor = null;

  /**
   * @param {InsertPreprocessor} preprocessor
   */
  this.setPreprocessor = function (preprocessor) {
    this.insertPreprocessor = preprocessor;
  };

  /**
   * @returns {Promise}
   */
  this.openDb = function () {
    return new Promise(function (resolve, reject) {
      if (_this.db && _this.isOpen) {
        return resolve(_this.db);
      } else if (_this.db && _this.busy) {
        _this.db.once('isOpen', function () {
          resolve(_this.db);
        });
      } else {
        _this.busy = true;
        client.connect(config.uri, config.options, function (err, db) {
          try {
            assert.equal(err, null, '(x) При открытии соединения с БД возвращен код ошибки. Ожидаемые параметры.' +
              '\n    URI: ' + config.uri +
              '\n    Параметры: ' + config.options +
              '\n    Ошибка: ' + err);
            debug.log('Получено соединение с базой: ', db.s.databaseName, '. URI: ', db.s.options.url);
            _this.db = db;
            _this.db.open(function () {
              _this.busy = false;
              _this.isOpen = true;
              debug.info('БД открыта');
              resolve(_this.db);
              _this.db.emit('isOpen', _this.db);
            });
          } catch (e) {
            debug.error(e);
            _this.busy = false;
            _this.isOpen = false;
            reject(e);
          }
        });
      }
    });
  };

  this._connection = function () {
    if (this.isOpen) {
      return this.db;
    }
    return null;
  };

  this._open = function () {
    return this.openDb();
  };

  this._close = function () {
    return new Promise(function (resolve, reject) {
      if (_this.db && _this.isOpen) {
        _this.busy = true;
        _this.db.close(true, function (err) {
          _this.isOpen = false;
          _this.busy = false;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  };

  /**
   * @param {String} type
   * @returns {Promise}
   */
  this.getCollection = function (type) {
    return new Promise(function (resolve, reject) {
      _this.openDb().then(function () {
        var c = _this.db.collection(type, {strict: true}, function (err, c) {
          if (err) {
            return reject(err);
          }
          if (!c) {
            c = _this.db.createCollection(type)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(c);
          }
        });
      }).catch(reject);
    });
  };

  this._delete = function (type, conditions) {
    return this.getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          c.deleteMany(conditions,
            function (err, result) {
              if (err) {
                debug.error(err);
                reject(err);
              } else if (result.deletedCount > 0) {
                resolve(result.deletedCount);
              }
            });
        });
      }
    );
  };

  this._insert = function (type, data) {
    return this.getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          var f = function (data) {
            c.insertOne(data, function (err, result) {
              if (err) {
                debug.error(err);
                reject(err);
              } else if (result.insertedId) {
                _this._get(type, {_id: result.insertedId}).then(resolve).catch(reject);
              }
            });
          };

          if (_this.insertPreprocessor) {
            _this.insertPreprocessor.
              preProcess(type, data).
              then(f).
              catch(reject);
          } else {
            f(data);
          }
        });
      }
    );
  };

  this.doUpdate = function (type, conditions, data, upsert, multi) {
    return this.getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          var f = function (data) {
            debug.debug('Запиcь в коллекцию ' + type + ' по условию ', conditions);
            if (!multi) {
              c.updateOne(conditions, {$set: data}, {upsert: upsert},
                function (err, result) {
                  if (err) {
                    debug.error(err);
                    reject(err);
                  } else if (result.result && result.result.n > 0) {
                    _this._get(type, conditions).then(resolve).catch(reject);
                  } else {
                    resolve();
                  }
                });
            } else {
              c.updateMany(conditions, {$set: data},
                function (err, result) {
                  if (err) {
                    debug.error(err);
                    reject(err);
                  } else if (result.result && result.result.n > 0) {
                    _this._fetch(type, {filter: conditions}).then(resolve).catch(reject);
                  } else {
                    resolve([]);
                  }
                });
            }
          };

          if (upsert && _this.insertPreprocessor) {
            _this.insertPreprocessor.
              preProcess(type, data).
              then(f).
              catch(reject);
          } else {
            f(data);
          }
        });
      });
  };

  this._update = function (type, conditions, data) {
    return this.doUpdate(type, conditions, data, false, false);
  };

  this._upsert = function (type, conditions, data) {
    return this.doUpdate(type, conditions, data, true, false);
  };

  this._fetch = function (type, options) {
      return this.getCollection(type).then(
        function (c) {
          return new Promise(function (resolve, reject) {
            var r = c.find(options.filter || {});

            if (options.sort) {
              r = r.sort(options.sort);
            }

            if (options.offset) {
              r = r.skip(options.offset);
            }

            if (options.count) {
              r = r.limit(options.count);
            }

            function work(amount) {
              r.toArray(function (err, docs) {
                r.close();
                if (err) {
                  debug.error(err);
                  return reject(err);
                }
                if (amount !== null) {
                  docs.total = amount;
                }
                resolve(docs);
              });
            }

            if (options.countTotal) {
              r.count(false, function (err, amount) {
                if (err) {
                  r.close();
                  debug.error(err);
                  return reject(err);
                }
                work(amount);
              });
            } else {
              work(null);
            }
          });
        }
      );
    };

  this._count = function (type, options) {
    return this.getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          var opts = {};
          if (options.offset) {
            opts.skip = options.offset;
          }
          if (options.count) {
            opts.limit = options.count;
          }

          c.count(options.filter || {}, opts, function (err, cnt) {
            if (err) {
              debug.error(err);
              reject(err);
            } else {
              resolve(cnt);
            }
          });
        });
      }
    );
  };

  this._get = function (type, conditions) {
      return _this.getCollection(type).then(
        function (c) {
          return new Promise(function (resolve, reject) {
            c.findOne(conditions, function (err, result) {
              if (err) {
                debug.error(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        });
    };
}

// Util.inherits(MongoDs, DataSource); //jscs:ignore requireSpaceAfterLineComment

MongoDs.prototype = new DataSource();

module.exports = MongoDs;
