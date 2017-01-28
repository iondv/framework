/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

var DbSync = require('core/interfaces/DbSync');

const AUTOINC_COLL = '__autoinc';
const PropertyTypes = require('core/PropertyTypes');

/* jshint maxstatements: 30, maxcomplexity: 30 */
function MongoDbSync(options) {

  var _this = this;

  /**
   * @type {String}
   */
  this.userTypeTableName = options.UsertypeTableName || 'ion_usertype';

  /**
   * @type {String}
   */
  this.metaTableName = options.MetaTableName || 'ion_meta';

  /**
   * @type {String}
   */
  this.viewTableName = options.ViewTableName || 'ion_view';

  /**
   * @type {String}
   */
  this.navTableName = options.NavTableName || 'ion_nav';

  /**
   * @type {String}
   */
  this.workflowTableName = options.WorkflowTableName || 'ion_workflow';

  var log = options.log || console;

  /**
   * @returns {Db}
   */
  function db() {return options.dataSource.connection(); }

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
        case 'user_type': {
          return new Promise(function (resolve, reject) {
            resolve(collection);
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
        case 'user_type':
          tn = _this.userTypeTableName;
          break;
        case 'workflow':
          tn = _this.workflowTableName;
          break;
      }

      if (!tn) {
        return reject('Unsupported meta type specified!');
      }
      db().collection(tn, {strict: true}, function (err, collection) {
        if (collection) {
          return resolve(collection);
        }
        db().createCollection(tn).then(sysIndexer(type)).then(resolve).catch(reject);
      });
    });
  }

  function getAutoIncColl() {
    return new Promise(function (resolve, reject) {
      db().collection(AUTOINC_COLL, {strict: true}, function (err, collection) {
        if (collection) {
          return resolve(collection);
        }
        db().createCollection(AUTOINC_COLL).then(
          function (autoinc) {
            return new Promise(function (rs, rj) {
              autoinc.createIndex({type: 1}, {unique: true}, function (err) {
                if (err) {
                  return rj(err);
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
  function findClassRoot(cm, namespace, metaCollection, done) {
    if (!cm.ancestor) {
      return done(null, cm);
    }
    var query = {name: cm.ancestor};
    if (namespace) {
      query.namespace = namespace;
    } else {
      query.$or = [{namespace: {$exists: false}}, {namespace: null}];
    }
    metaCollection.find(query).limit(1).next(function (err, anc) {
      if (err) {
        return done(err);
      }
      if (anc) {
        findClassRoot(anc, namespace, metaCollection, done);
      } else {
        done(new Error('Класс ' + cm.ancestor + ' не найден!'));
      }
    });
  }

  this._init = function () {
    return new Promise(function (resolve, reject) {
      getMetaTable('meta').
        then(function () {return getMetaTable('view');}).
        then(function () {return getMetaTable('nav');}).
        then(function () {return getMetaTable('user_type');}).
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
      db().collection(
        cn,
        {strict: true},
        function (err, collection) {
          if (!collection) {
            db().createCollection(cn).then(resolve).catch(reject);
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
      function createIndexPromise(props, unique, nullable) {
        return new Promise(
          function (resolve) {
            var opts, i;
            opts = {};
            if (unique) {
              opts.unique = true;
              if (nullable) {
                opts.sparse = true;
              }
            }

            var indexDef = {};
            if (typeof props === 'string') {
              indexDef = props;
            } else if (Array.isArray(props)) {
              for (i = 0; i < props.length; i++) {
                if (props[i]) {
                  indexDef[props[i]] = 1;
                }
              }
            }

            if (Object.getOwnPropertyNames(indexDef).length === 0) {
              return resolve();
            }

            collection.createIndex(indexDef, opts, function (err, iname) {
              resolve(iname);
            });
          }
        );
      }

      function createFullText(props) {
        return new Promise(function (resolve, reject) {
          var indexDef = {};
          for (var i = 0; i < props.length; i++) {
            indexDef[props[i]] = 'text';
          }
          var opts = {};
          collection.createIndex(indexDef, opts, function (err, iname) {
            resolve(iname);
          });
        });
      }

      return new Promise(function (resolve, reject) {
        var i, j, promises, tmp;
        promises = [];
        promises.push(createIndexPromise(cm.key, true));
        promises.push(createIndexPromise('_class', false));

        var fullText = [];
        var props = {};
        for (i = 0; i < cm.properties.length; i++) {
          props[cm.properties[i].name] = cm.properties[i];
          if (
            cm.properties[i].type === PropertyTypes.REFERENCE ||
            cm.properties[i].indexed ||
            cm.properties[i].unique
          ) {
            promises.push(
              createIndexPromise(cm.properties[i].name, cm.properties[i].unique, cm.properties[i].nullable)
            );
          }

          if (
            cm.properties[i].indexSearch &&
            (
              cm.properties[i].type === PropertyTypes.STRING ||
              cm.properties[i].type === PropertyTypes.URL ||
              cm.properties[i].type === PropertyTypes.HTML ||
              cm.properties[i].type === PropertyTypes.TEXT
            )
          ) {
            fullText.push(cm.properties[i].name);
          }
        }

        if (cm.compositeIndexes) {
          for (i = 0; i < cm.compositeIndexes.length; i++) {
            tmp = false;
            for (j = 0; j < cm.compositeIndexes[i].properties.length; j++) {
              if (props[cm.compositeIndexes[i].properties[j]].nullable) {
                tmp = true;
                break;
              }
            }
            promises.push(createIndexPromise(cm.compositeIndexes[i].properties, cm.compositeIndexes[i].unique, tmp));
          }
        }

        if (fullText.length) {
          promises.push(createFullText(fullText));
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
                return reject(err);
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
                  return reject(err);
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
    classMeta.namespace = namespace || null;
    return new Promise(function (resolve, reject) {
      getMetaTable('meta').then(function (metaCollection) {
        findClassRoot(classMeta, namespace, metaCollection, function (err, cm) {
          if (err) {
            return reject(err);
          }
          _this._createCollection(cm, namespace).
          then(_this._addAutoInc(classMeta)).
          then(_this._addIndexes(classMeta)).
          then(function () {
            delete classMeta._id;
            log.log('Регистрируем класс ' + classMeta.name);
            metaCollection.updateOne(
              {
                name: classMeta.name,
                version: classMeta.version,
                namespace: namespace
              },
              classMeta,
              {upsert: true},
              function (err, result) {
                if (err) {
                  return reject(err);
                }
                log.log('Класс ' + classMeta.name + ' зарегистрирован.');
                resolve(result);
              }
            );
          }).catch(reject);
        });
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
      viewMeta.namespace = namespace || null;
      viewMeta.path = path || '';
      delete viewMeta._id;

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
            log.log('Создано представление ' + type + ' для класса ' + className);
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
            return reject(err);
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
        navSection.namespace = namespace || null;
        delete navSection._id;

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
              return reject(err);
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
            return reject(err);
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
        navNode.namespace = namespace || null;
        delete navNode._id;

        collection.updateOne(
          {
            code: navNode.code,
            itemType: navNode.itemType,
            namespace: navNode.namespace
          }, navNode, {upsert: true}, function (err, ns) {
          if (err) {
            return reject(err);
          }
          log.log('Создан узел навигации ' + navNode.code);
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
            return reject(err);
          }
          resolve(nnm);
        });
      }).catch(reject);
    });
  };

  /**
   * @param {{wfClass: String, name: String, version: String}} wfMeta
   * @param {String} [namespace]
   * @returns {Promise}
   * @private
   */
  this._defineWorkflow = function (wfMeta, namespace) {
    return new Promise(function (resolve, reject) {
      wfMeta.namespace = namespace || null;
      delete wfMeta._id;

      getMetaTable('workflow').then(function (collection) {
        collection.update(
          {
            wfClass: wfMeta.wfClass,
            name: wfMeta.name,
            namespace: wfMeta.namespace,
            version: wfMeta.version
          },
          wfMeta,
          {upsert: true},
          function (err, wf) {
            if (err) {
              return reject(err);
            }
            log.log('Создан бизнес-процесс ' + wfMeta.name + ' для класса ' + wfMeta.wfClass);
            resolve(wf);
          });
      }).catch(reject);
    });
  };

  /**
   * @param {String} className
   * @param {String} name
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Promise}
   * @private
   */
  this._undefineWorkflow = function (className, name, namespace, version) {
    return new Promise(function (resolve, reject) {
      getMetaTable('view').then(function (collection) {
        var query = {
          wfClass: className,
          name: name
        };
        if (version) {
          query.version = version;
        }

        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }

        collection.remove(query, function (err, wf) {
          if (err) {
            return reject(err);
          }
          resolve(wf);
        });
      }).catch(reject);
    });
  };

  this._defineUserType = function (userType) {
    return new Promise(function (resolve, reject) {
      getMetaTable('user_type').then(function (collection) {
        collection.updateOne(
          {
            name: userType.name
          },
          userType,
          {upsert: true},
          function (err, ns) {
            if (err) {
              return reject(err);
            }
            resolve(ns);
          }
        );
      }).catch(reject);
    });
  };
}

MongoDbSync.prototype = new DbSync();
module.exports = MongoDbSync;
