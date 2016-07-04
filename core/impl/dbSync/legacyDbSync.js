'use strict';

var DbSync = require('core/interfaces/DbSync');
var debug = require('debug-log')('ION:dbSync');
var mongo = require('mongodb');

/**
 * @param {Db} connection
 * @param {{ metadata: {MetaTableName:string, NavTableName: string} } } config
 * @constructor
 */
function LegacyDbSync(connection,config){

  var me = this;

  /**
   * @type {string}
   */
  this.metaTableName = "ion_meta";

  this.navTableName = "ion_menu";

  /**
   * @type {Db}
   */
  this.db = connection;

  if(config.metadata){
    if(config.metadata.MetaTableName){
      this.metaTableName = config.metadata.MetaTableName;
    }
    if(config.metadata.NavTableName){
      this.navTableName = config.metadata.NavTableName;
    }
  }

  /**
   * @param {object} cm
   * @returns {Promise}
   * @private
   */
  this._createCollection = function(cm){
    return new Promise(function(resolve, reject){
      me.db.collection(cm.name,{ strict:true },function(err, collection){
        debug.debug("Получение коллекции для класса "+cm.name);
        if (err){
          debug.debug("Создание коллекции для класса "+cm.name);
          me.db.createCollection(cm.name).then(function(collection){
            debug.debug("Создана коллекция для класса " + cm.name);
            resolve(collection);
          }).catch(reject);
        } else {
          debug.debug("Найдена коллекция для класса " + cm.name);
          resolve(collection);
        }
      });
    });
  };

  /**
   * @param {object} cm
   * @private
   */
  this._addIndexes = function(cm){
    /**
     * @param {Collection} collection
     */
    return function(collection){
      var i, promises = [];
      debug.debug("Создание индексов для класса "+cm.name+" (коллекция "+collection.s.name+")");
      function createIndexPromise(props, unique){
        var opts = {}, i;
        if (unique){
          opts.unique = true;
        }

        var indexDef = {};
        if (typeof props === "string") {
          indexDef[props] = 1;
        } else if (Array.isArray(props)) {
          for (i = 0; i < props.length; i++) {
            indexDef[props[i]] = 1;
          }
        }

        return new Promise(
          function(resolve, reject){
            collection.ensureIndex(indexDef, opts, function(err, iname){
              if (err) {
                return reject(err);
              }
              debug.debug("Создан индекс "+iname);
              resolve(iname);
            });
          }
        );
      }

      if (cm.key && (cm.key.length > 0)) {
        promises[promises.length] = createIndexPromise(cm.key, true);
      }

      for (i = 0; i < cm.properties.length; i++) {
        if ((!cm.key || (cm.key.indexOf(cm.properties[i].name) === -1)) && (cm.properties[i].type === 13 || (cm.properties[i].indexed === true))){
          promises[promises.length] = createIndexPromise(cm.properties[i].name, cm.properties[i].unique);
        }
      }

      if (cm.compositeIndexes) {
        for(i = 0; i < cm.compositeIndexes.length; i++) {
          promises[promises.length] = createIndexPromise(cm.compositeIndexes[i].properties, cm.compositeIndexes[i].unique);
        }
      }

      return new Promise(function(resolve, reject){
        Promise.all(promises).
          then(function(inames){
            resolve(collection);
          }).
          catch(reject);
      });
    };
  };

  /**
   * @param {object} classMeta
   * @returns {Promise}
   * @private
   */
  this._defineClass = function(classMeta){
    return new Promise(function(resolve, reject) {
      me._createCollection(classMeta).
        then(me._addIndexes(classMeta)).
        then(function(collection){
              me.db.collection(me.metaTableName,
                function(err, collection) {
                    if (err) {
                      return reject(err);
                    }
                    collection.insertOne(
                      {
                        name: classMeta.name,
                        caption: classMeta.caption,
                        _version: classMeta.version,
                        class: classMeta,
                        item: null,
                        create: null,
                        list: null
                      }).then(function (cm) {
                        debug.debug("Определен новый класс " + cm.ops[0].name + ":" + cm.ops[0]._version);
                        resolve(cm.ops[0]);
                      }).catch(reject);
                }
              );
        }).
        catch(reject);
    });
  };

  this._undefineClass = function(className, version){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.metaTableName, function(err, collection) {
        var query = {name: className};
        if (version) {
          query._version = version;
        }
        collection.remove(query, function (err, cm) {
          if (err) {
            return reject(err);
          }
          resolve(cm);
        });
      });
    });
  };

  this._defineView = function(viewMeta, className, type, path){
    return new Promise(function(resolve, reject) {
      debug.debug("Сохранение представления типа "+type+" класса "+className);

      me.db.collection(me.metaTableName, function(err, c){
        if (err) {
          return reject(err);
        }

        var conds = {name: className};

        if (viewMeta.version) {
          conds._version = {$lte: viewMeta.version};
        }

        c.find(conds, {sort:{_version: -1}}).
          limit(1).toArray(function(err, result){
            if (err){
              return reject(err);
            }

            if (result.length === 0){
              return reject(new Error('Класс '+className+' не найден!'));
            }

            var updates = result[0];
            updates[type] = viewMeta;
            c.updateOne({_id: updates._id}, updates).then(function(cm){
              debug.debug("Сохранено представление "+type+" класса "+className);
              resolve();
            }).catch(reject);
          });
      });
    });
  };

  this._undefineView = function(className, type, path, version){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.metaTableName, function (err, c) {
        if (err) {
          return reject(err);
        }

        var conds = {name: className};

        if (version) {
          conds._version = {$lte: version};
        }

        c.find(conds, {sort: {_version: -1}}).
          limit(1).toArray(function (err, result) {
            if (err) {
              return reject(err);
            }

            if (result.length === 0) {
              return reject(new Error('Класс ' + className + ' не найден!'));
            }

            var updates = result[0];
            updates[type] = null;
            c.updateOne({_id: updates._id}, updates).then(function (cm) {
              debug.debug("Удалено представление " + type + " класса " + className);
              resolve();
            }).catch(reject);
          });
      });
    });
  };

  this._defineNavSection = function(navSection){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.navTableName,
        /**
         * @param err
         * @param {Collection} navCollection
         */
        function(err, navCollection){
          navCollection.updateOne({name:navSection.name}, navSection, {upsert: true}, function(err, ns){
            if(err){
              reject(err);
            }
            resolve(ns);
          });
        }
      );
    });
  };

  this._undefineNavSection = function(sectionName){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.navTableName, function(err, navCollection){
        if(err){
          reject(err);
        }
        navCollection.remove({name:sectionName},function(err,nsm){
          if(err){
            reject(err);
          }
          resolve();
        });
      });
    });
  };

  this._defineNavNode = function(navNode,navSectionName){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.navTableName, function(err, navCollection){
        if(err){
          reject(err);
        }
        navCollection.updateOne({code:navNode.code}, navNode, {upsert: true},function(err, ns){
          if(err){
            reject(err);
          }
          resolve(ns);
        });
      });
    });
  };

  this._undefineNavNode = function(navNodeName){
    return new Promise(function(resolve, reject) {
      me.db.collection(me.navTableName, function(err, navCollection){
        navCollection.remove({code:navNodeName},function(err,nnm){
          if(err){
            reject(err);
          }
          resolve();
        });
      });
    });
  };
}

LegacyDbSync.prototype = new DbSync();
module.exports = LegacyDbSync;
