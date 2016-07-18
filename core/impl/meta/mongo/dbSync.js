/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

var DbSync = require('core/interfaces/DbSync');

const AUTOINC_COLL = '__autoinc';

/* jshint maxstatements: 30 */
function MongoDbSync(connection, config) {

  var _this = this;

  /**
   * @type {String}
   */
  this.metaTableName = 'ion_meta';

  /**
   * @type {String}
   */
  this.viewTableName = 'ion_view';

  /**
   * @type {String}
   */
  this.navTableName = 'ion_nav';

  /**
   * @type {Db}
   */
  this.db = connection;

  if (config.metaTables) {
    if (config.metaTables.MetaTableName) {
      this.metaTableName = config.metaTables.MetaTableName;
    }
    if (config.metaTables.ViewTableName) {
      this.viewTableName = config.metaTables.ViewTableName;
    }
    if (config.metaTables.NavTableName) {
      this.navTableName = config.metaTables.NavTableName;
    }
  }

  function sysIndexer(tableType) {
    return function (collection) {
      switch (tableType) {
        case 'meta': {
          return new Promise(function (resolve, reject) {
            collection.createIndex({
                namespace: 1,
                name: 1,
                version: 1
              },
              {
                unique: true
              }, function (err) {
                if (err) {
                  return reject(err);
                }
                resolve(collection);
              });
          });
        }break;
        case 'view': {
          return new Promise(function (resolve, reject) {
            collection.createIndex({
                namespace: 1,
                type: 1,
                path: 1,
                className: 1,
                version: 1
              },
              {
                unique: true
              }, function (err) {
                if (err) {
                  return reject(err);
                }
                resolve(collection);
              });
          });
        }break;
        case 'nav': {
          return new Promise(function (resolve, reject) {
            collection.createIndex({
                namespace: 1,
                itemType: 1,
                name: 1,
                code: 1
              },
              {
                unique: true
              }, function (err) {
                if (err) {
                  return reject(err);
                }
                resolve(collection);
              });
          });
        }break;
      }
      throw new Error('Unsupported table type specified!');
    };
  }

  function getMetaTable(type) {
    return new Promise(function (resolve, reject) {
      var tn = '';
      switch (type) {
        case 'meta':
          tn = _this.metaTableName;
          break;
        case 'view':
          tn = _this.viewTableName;
          break;
        case 'nav':
          tn = _this.navTableName;
          break;
      }

      if (!tn) {
        return reject('Unsupported meta type specified!');
      }

      _this.db.collection(tn, {strict: true}, function (err, collection) {
        if (collection) {
          return resolve(collection);
        }
        _this.db.createCollection(tn).then(sysIndexer(type)).then(resolve).catch(reject);
      });
    });
  }

  function getAutoIncColl() {
    return new Promise(function (resolve, reject) {
      _this.db.collection(AUTOINC_COLL, {strict: true}, function (err, collection) {
        if (collection) {
          return resolve(collection);
        }
        _this.db.createCollection(AUTOINC_COLL).then(
          function (autoinc) {
            return new Promise(function (rs, rj) {
              autoinc.createIndex({type: 1}, {unique: true}, function (err) {
                if (err) {
                  rj(err);
                }
                rs(autoinc);
              });
            });
          }
        ).then(resolve).catch(reject);
      });
    });
  }

  /**
   * @param {{}} cm
   * @param {String} namespace
   * @returns {Promise}
   */
  function findClassRoot(cm, namespace) {
    if (!cm.ancestor) {
      return new Promise(function (resolve) {
        resolve(cm);
      });
    }
    return new Promise(function (resolve, reject) {
      getMetaTable('meta').then(function (collection) {
        var query = {name: cm.ancestor};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        collection.findOne(query, function (err, anc) {
          if (err) {
            return reject(err);
          }
          if (anc) {
            return findClassRoot(anc).then(resolve).catch(reject);
          }
          reject({Error: 'Класс ' + cm.ancestor + ' не найден!'});
        });
      }).catch(reject);
    });
  }

  this._init = function () {
    return new Promise(function (resolve, reject) {
      getMetaTable('meta').
        then(function () {return getMetaTable('view');}).
        then(function () {return getMetaTable('nav');}).
        then(function () {return getAutoIncColl();}).
        then(resolve).
        catch(reject);
    });
  };

  /**
   * @param {{}} cm
   * @param {String} namespace
   * @returns {Promise}
   * @private
   */
  this._createCollection = function (cm, namespace) {
    return new Promise(function (resolve, reject) {
      var cn = (namespace ? namespace + '_' : '') + cm.name;
      _this.db.collection(
        cn,
        {strict: true},
        function (err, collection) {
          if (!collection) {
            _this.db.createCollection(cn).then(resolve).catch(reject);
          } else {
            if (err) {
              return reject(err);
            }
            resolve(collection);
          }
        }
      );
    });
  };

  /**
   * @param {{}} cm
   * @private
   */
  this._addIndexes = function (cm) {
    /**
     * @param {Collection} collection
     */
    return function (collection) {
      function createIndexPromise(props, unique) {
        return new Promise(
          function (resolve) {
            var opts, i;
            opts = {};
            if (unique) {
              opts.unique = true;
            }

            var indexDef = {};
            if (typeof props === 'string') {
              indexDef = props;
            } else if (Array.isArray(props)) {
              for (i = 0; i < props.length; i++) {
                indexDef[props[i]] = 1;
              }
            }
            collection.createIndex(indexDef, opts, function (err, iname) {
              /*
               If (err) {
               return reject(err);
               }
               */
              resolve(iname);
            });
          }
        );
      }

      return new Promise(function (resolve, reject) {
        var i, promises;
        promises = [];
        promises.push(createIndexPromise(cm.key, true));
        promises.push(createIndexPromise('_class', false));

        for (i = 0; i < cm.properties.length; i++) {
          if (cm.properties[i].type === 13 || cm.properties[i].indexed === true) {
            promises.push(createIndexPromise(cm.properties[i].name, cm.properties[i].unique));
          }
        }

        if (cm.compositeIndexes) {
          for (i = 0; i < cm.compositeIndexes.length; i++) {
            promises.push(createIndexPromise(cm.compositeIndexes[i].properties, cm.compositeIndexes[i].unique));
          }
        }

        Promise.all(promises).
        then(function () {
          resolve(collection);
        }).
        catch(reject);
      });
    };
  };

  this._addAutoInc = function (cm) {
    var cn = (cm.namespace ? cm.namespace + '_' : '') + cm.name;
    /**
     * @param {Collection} collection
     */
    return function (collection) {
      return new Promise(function (resolve, reject) {
        var inc = {};
        for (var i = 0; i < cm.properties.length; i++) {
          if (cm.properties[i].type === 6 && cm.properties[i].autoassigned === true) {
            inc[cm.properties[i].name] = 0;
          }
        }

        if (Object.keys(inc).length > 0) {
          getAutoIncColl().then(function (autoinc) {
            autoinc.find({type: cn}).limit(1).next(function (err, c) {
              if (err) {
                reject(err);
              }

              if (c && c.counters) {
                for (var nm in c.counters) {
                  if (c.counters.hasOwnProperty(nm) && inc.hasOwnProperty(nm)) {
                    inc[nm] = c.counters[nm];
                  }
                }
              }

              autoinc.updateOne({type: cn}, {$set: {counters: inc}}, {upsert: true}, function (err) {
                if (err) {
                  reject(err);
                }
                resolve(collection);
              });
            });
          }).catch(reject);
          return;
        }
        resolve(collection);
      });
    };
  };

  /**
   * @param {{}} classMeta
   * @param {String} [namespace]
   * @returns {Promise}
   * @private
   */
  this._defineClass = function (classMeta, namespace) {
    classMeta.namespace = namespace;
    return new Promise(function (resolve, reject) {
      findClassRoot(classMeta, namespace).
      then(function (cm) {
        return _this._createCollection(cm, namespace);
      }).
      then(_this._addAutoInc(classMeta)).
      then(_this._addIndexes(classMeta)).
      then(function () {
        getMetaTable('meta').then(function (collection) {
          collection.update(
            {
              name: classMeta.name,
              version: classMeta.version,
              namespace: namespace
            },
            classMeta,
            {upsert: true},
            function (err, result) {
              if (err) {
                reject(err);
              }
              resolve(result);
            });
        }).catch(reject);
      }).catch(reject);
    });
  };

  this._undefineClass = function (className, version, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('meta').then(function (collection) {
        var query = {name: className};
        if (version) {
          query.version = version;
        }
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        collection.remove(query, function (err, cm) {
          if (err) {
            return reject(err);
          }
          resolve(cm);
        });
      }).catch(reject);
    });
  };

  this._defineView = function (viewMeta, className, type, path, namespace) {
    return new Promise(function (resolve, reject) {
      viewMeta.type = type;
      viewMeta.className = className;
      viewMeta.namespace = namespace;
      if (path !== null) {
        viewMeta.path = path;
      } else {
        reject(new Error('не передан path'));
      }

      getMetaTable('view').then(function (collection) {
        collection.update(
          {
            type: viewMeta.type,
            className: viewMeta.className,
            path: viewMeta.path,
            namespace: viewMeta.namespace,
            version: viewMeta.version
          },
          viewMeta,
          {upsert: true},
          function (err, vm) {
            if (err) {
              return reject(err);
            }
            resolve(vm);
          });

      }).catch(reject);
    });
  };

  this._undefineView = function (className, type, path, version, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('view').then(function (collection) {
        var query = {
          className: className,
          type: type,
          path: path
        };
        if (version) {
          query.version = version;
        }

        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }

        collection.remove(query, function (err,vm) {
          if (err) {
            reject(err);
          }
          resolve(vm);
        });
      }).catch(reject);
    });
  };

  this._defineNavSection = function (navSection, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('nav').then(function (collection) {
        navSection.itemType = 'section';
        navSection.namespace = namespace;
        collection.updateOne(
          {
            name: navSection.name,
            itemType: navSection.itemType,
            namespace: navSection.namespace
          },
          navSection,
          {upsert: true},
          function (err, ns) {
            if (err) {
              reject(err);
            }
            resolve(ns);
          });
      }).catch(reject);
    });
  };

  this._undefineNavSection = function (sectionName, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('nav').then(function (collection) {
        var query = {name: sectionName, itemType: 'section'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }

        collection.remove(query, function (err,nsm) {
          if (err) {
            reject(err);
          }
          resolve(nsm);
        });
      }).catch(reject);
    });
  };

  this._defineNavNode = function (navNode,navSectionName, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('nav').then(function (collection) {
        navNode.itemType = 'node';
        navNode.section = navSectionName;
        navNode.namespace = namespace;
        collection.updateOne(
          {
            code: navNode.code,
            itemType: navNode.itemType,
            namespace: navNode.namespace
          }, navNode, {upsert: true}, function (err, ns) {
          if (err) {
            reject(err);
          }
          resolve(ns);
        });
      }).catch(reject);
    });
  };

  this._undefineNavNode = function (navNodeName, namespace) {
    return new Promise(function (resolve, reject) {
      getMetaTable('nav').then(function (collection) {
        var query = {code: navNodeName, itemType: 'node'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        collection.remove(query, function (err,nnm) {
          if (err) {
            reject(err);
          }
          resolve(nnm);
        });
      }).catch(reject);
    });
  };
}

MongoDbSync.prototype = new DbSync();
module.exports = MongoDbSync;
