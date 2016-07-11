/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

var DbSync = require('core/interfaces/DbSync');
var debug = require('debug-log')('ION:dbSync');

function IonDbSync(connection, config) {

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

  /**
   * @param {{}} cm
   * @returns {Promise}
   * @private
   */
  this._createCollection = function (cm, namespace) {
    return new Promise(function (resolve, reject) {
      var collection = _this.db.collection(
        (namespace ? (namespace + '_') : '') + cm.name,
        function (err, collection) {
          if (err) {
            return reject(err);
          }
          if (!collection) {
            _this.db.createCollection(cm.name).then(resolve).catch(reject);
          } else {
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
      var i, promises;
      promises = [];

      function createIndexPromise(props, unique) {
        return new Promise(
          function (resolve, reject) {
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
        var promises = [];
        promises.push(createIndexPromise(cm.key, true));
        promises.push(createIndexPromise('_class', false));

        for (i = 0; i < cm.properties.length; i++) {
          if (cm.properties[i].type === 13 || (cm.properties[i].indexed === true)) {
            promises.push(createIndexPromise(cm.properties[i].name, cm.properties[i].unique));
          }
        }

        if (cm.compositeIndexes) {
          for (i = 0; i < cm.compositeIndexes.length; i++) {
            promises.push(createIndexPromise(cm.compositeIndexes[i].properties, cm.compositeIndexes[i].unique));
          }
        }

        Promise.all(promises).
          then(function (inames) {
            resolve(collection);
          }).
          catch(reject);
      });
    };
  };

  /**
   * @param {{}} cm
   * @returns {Promise}
   */
  function findClassRoot(cm, namespace) {
    if (!cm.ancestor) {
      return new Promise(function (resolve, reject) {
        resolve(cm);
      });
    }
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.metaTableName, function (err, collection) {
        if (err) {
          return reject(err);
        }
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
      });
    });
  }

  /**
   * @param {{}} classMeta
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
      then(_this._addIndexes(classMeta)).
      then(function () {
        _this.db.collection(_this.metaTableName, function (err, collection) {
          if (err) {
            return reject(err);
          }
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
        });
      }).
      catch(reject);
    });
  };

  this._undefineClass = function (className, version, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.metaTableName, function (err, collection) {
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
      });
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
      _this.db.collection(_this.viewTableName, function (err, viewCollection) {
          if (err) {
            return reject(err);
          }
          viewCollection.update(
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
        });
    });
  };

  this._undefineView = function (className, type, path, version, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.viewTableName, function (err, viewCollection) {
          if (err) {
            reject(err);
          }

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

          viewCollection.remove(query, function (err,vm) {
            if (err) {
              reject(err);
            }
            resolve(vm);
          });
        });
    });
  };

  this._defineNavSection = function (navSection, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.navTableName,
        /**
         * @param err
         * @param {Collection} navCollection
         */
         function (err, navCollection) {
            navSection.itemType = 'section';
            navSection.namespace = namespace;
            navCollection.updateOne(
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
          }
        );
    });
  };

  this._undefineNavSection = function (sectionName, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.navTableName, function (err, navCollection) {
        if (err) {
          reject(err);
        }
        var query = {name: sectionName, itemType: 'section'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }

        navCollection.remove(query, function (err,nsm) {
          if (err) {
            reject(err);
          }
          resolve(nsm);
        });
      });
    });
  };

  this._defineNavNode = function (navNode,navSectionName, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.navTableName, function (err, navCollection) {
        if (err) {
          reject(err);
        }
        navNode.itemType = 'node';
        navNode.section = navSectionName;
        navNode.namespace = namespace;
        navCollection.updateOne(
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
      });
    });
  };

  this._undefineNavNode = function (navNodeName, namespace) {
    return new Promise(function (resolve, reject) {
      _this.db.collection(_this.navTableName, function (err, navCollection) {
        var query = {code: navNodeName, itemType: 'node'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        navCollection.remove(query, function (err,nnm) {
          if (err) {
            reject(err);
          }
          resolve(nnm);
        });
      });
    });
  };

}

IonDbSync.prototype = new DbSync();
module.exports = IonDbSync;
