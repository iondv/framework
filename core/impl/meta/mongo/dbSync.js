/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

const DbSync = require('core/interfaces/DbSync');

const AUTOINC_COLL = '__autoinc';
const GEOFLD_COLL = '__geofields';
const PropertyTypes = require('core/PropertyTypes');

/* jshint maxstatements: 40, maxcomplexity: 30 */
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
    return (collection) => {
      switch (tableType) {
        case 'meta': {
          return new Promise((resolve, reject) => {
            collection.createIndex({
                namespace: 1,
                name: 1,
                version: 1
              },
              {
                unique: true
              },
              (err) => err ? reject(err) : resolve(collection)
              );
          });
        }break;
        case 'view': {
          return new Promise((resolve, reject) => {
            collection.createIndex({
                namespace: 1,
                type: 1,
                path: 1,
                className: 1,
                version: 1
              },
              {
                unique: true
              },
              (err) => err ? reject(err) : resolve(collection)
            );
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
              },
              (err) => err ? reject(err) : resolve(collection)
            );
          });
        }break;
        case 'user_type': {
          return Promise.resolve(collection);
        }break;
      }
      throw new Error('Unsupported table type specified!');
    };
  }

  function getMetaTable(type) {
    let tn = '';
    switch (type) {
      case 'meta': tn = _this.metaTableName; break;
      case 'view': tn = _this.viewTableName; break;
      case 'nav': tn = _this.navTableName; break;
      case 'user_type': tn = _this.userTypeTableName; break;
      case 'workflow': tn = _this.workflowTableName; break;
    }

    if (!tn) {
      return Promise.reject('Unsupported meta type specified!');
    }
    return new Promise((resolve, reject) => {
      db().collection(tn, {strict: true}, (err, collection) => {
        if (collection) {
          return resolve(collection);
        }
        db().createCollection(tn).then(sysIndexer(type)).then(resolve).catch(reject);
      });
    });
  }

  function getSysColl(name) {
    return new Promise((resolve, reject) => {
      db().collection(name, {strict: true}, (err, collection) => {
        if (collection) {
          return resolve(collection);
        }
        db().createCollection(name).then(
          (collection) => {
            return new Promise((resolve, reject) => {
              collection.createIndex({__type: 1}, {unique: true}, (err) => err ? reject(err) : resolve(collection));
            });
          }
        ).then(resolve).catch(reject);
      });
    });
  }

  /**
   * @param {String} name
   * @returns {{name: String, namespace: String}}
   */
  function parseCanonicalName(name) {
    let parts = name.split('@');
    let result = {name: parts[0]};
    if (parts.length > 1) {
      result.namespace = parts[1];
    }
    return result;
  }

  /**
   * @param {{}} cm
   * @param {String} namespace
   * @returns {Promise}
   */
  function findClassRoot(cm, namespace, metaCollection, done, h) {
    if (!cm.ancestor) {
      return done(null, cm);
    }
    let cn = parseCanonicalName(cm.ancestor);
    let query = {name: cn.name};
    namespace = cn.namespace || cm.namespace || namespace;
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
        if (Array.isArray(h)) {
          h.unshift(anc);
        }
        findClassRoot(anc, namespace, metaCollection, done, h);
      } else {
        done(new Error('Класс ' + cn.name + '@' + namespace + ' не найден!'));
      }
    });
  }

  this._init = function () {
    return getMetaTable('meta').
        then(() => getMetaTable('view')).
        then(() => getMetaTable('nav')).
        then(() => getMetaTable('user_type')).
        then(() => getSysColl(AUTOINC_COLL)).
        then(() => getSysColl(GEOFLD_COLL));
  };

  /**
   * @param {{}} cm
   * @param {String} namespace
   * @returns {Promise}
   * @private
   */
  function createCollection(cm, namespace) {
    return new Promise(function (resolve, reject) {
      namespace = cm.namespace || namespace;
      let cn = (namespace ? namespace + '_' : '') + cm.name;
      db().collection(
        cn,
        {strict: true},
        (err, collection) => {
          if (!collection) {
            db().createCollection(cn).then(resolve).catch(reject);
          } else {
            return err ? reject(err) : resolve(collection);
          }
        }
      );
    });
  }

  /**
   * @param {{}} cm
   * @param {{}} rcm,
   * @param {String} namespace
   * @private
   */
  function addIndexes(cm, rcm, namespace, h) {
    /**
     * @param {Collection} collection
     */
    return (collection) => {
      function createIndexPromise(props, unique, nullable) {
        return function () {
          let opts = {};
          if (unique) {
            opts.unique = true;
            if (nullable) {
              opts.sparse = true;
            }
          }

          let indexDef = {};
          if (Array.isArray(props)) {
            props.forEach((p) => {
              indexDef[p.name] = (p.type === PropertyTypes.GEO) ? '2dsphere' : 1;
            });
          }

          if (Object.getOwnPropertyNames(indexDef).length === 0) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            collection.createIndex(indexDef, opts, (err, iname) => {
              resolve(iname);
            });
          });
        };
      }

      function createFullText(props) {
        return function () {
          let indexDef = {};
          for (let i = 0; i < props.length; i++) {
            indexDef[props[i]] = 'text';
          }
          let opts = {};
          return new Promise((resolve) => {
            collection.createIndex(indexDef, opts, (err, iname) => {
              resolve(iname);
            });
          });
        };
      }

      function registerGeoField(property) {
        return function () {
          return getSysColl(GEOFLD_COLL)
            .then(function (coll) {
              return new Promise((resolve, reject) => {
                let ns = rcm.namespace || namespace;
                let cn = (ns ? ns+ '_' : '') + rcm.name;
                let d = {};
                d[property.name] = true;
                coll.updateOne(
                  {
                    __type: cn
                  },
                  {$set: d},
                  {upsert: true},
                  (err) => err ? reject(err) : resolve()
                );
              });
            });
        };
      }

      function fillProps(props, cm) {
        for (let i = 0; i < cm.properties.length; i++) {
          props[cm.properties[i].name] = cm.properties[i];
        }
      }


      let fullText = [];
      let props = {};
      if (Array.isArray(h)) {
        h.forEach((anc) => fillProps(props, anc));
      }

      let promise = createIndexPromise(cm.key, true)();
      promise = promise.then(createIndexPromise('_class', false, false));

      for (let i = 0; i < cm.properties.length; i++) {
        props[cm.properties[i].name] = cm.properties[i];
        if (
          (cm.properties[i].type === PropertyTypes.REFERENCE ||
          cm.properties[i].indexed ||
          cm.properties[i].unique) &&
          cm.properties[i].type !== PropertyTypes.TEXT &&
          cm.properties[i].type !== PropertyTypes.HTML
        ) {
          promise = promise
            .then(createIndexPromise([cm.properties[i]], cm.properties[i].unique, cm.properties[i].nullable));
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

        if (cm.properties[i].type === PropertyTypes.GEO) {
          promise = promise.then(registerGeoField(cm.properties[i]));
        }
      }

      if (cm.compositeIndexes) {
        for (let i = 0; i < cm.compositeIndexes.length; i++) {
          let nlbl = false;
          let skip = false;
          let iprops = [];
          for (let j = 0; j < cm.compositeIndexes[i].properties.length; j++) {
            if (
              props[cm.compositeIndexes[i].properties[j]].type === PropertyTypes.TEXT ||
              props[cm.compositeIndexes[i].properties[j]].type === PropertyTypes.HTML
            ) {
              skip = true;
              break;
            }
            if (props[cm.compositeIndexes[i].properties[j]].nullable) {
              nlbl = true;
            }
            iprops.push(props[cm.compositeIndexes[i].properties[j]]);
          }
          if (!skip) {
            promise = promise.then(createIndexPromise(iprops, cm.compositeIndexes[i].unique, nlbl));
          }
        }
      }

      if (fullText.length) {
        promise = promise.then(createFullText(fullText));
      }

      return promise;
    };
  }

  function addAutoInc(cm) {
    /**
     * @param {Collection} collection
     */
    return function (collection) {
      let cn = (cm.namespace ? cm.namespace + '_' : '') + cm.name;
      let steps = {};
      let adjustments = {};
      let counters = {};
      for (let i = 0; i < cm.properties.length; i++) {
        let p = cm.properties[i];
        if (p.type === 6 && p.autoassigned === true) {
          counters[p.name] = 0;
          if (p.unique || (Array.isArray(cm.keys) && cm.keys.length === 1 && cm.keys[0] === p.name)) {
            steps[p.name] = 1;
            adjustments[p.name] = true;
          } else {
            steps[p.name] = 1;
          }
        }
      }
      if (Object.keys(steps).length > 0) {
        return getSysColl(AUTOINC_COLL).then((autoinc) => {
          return new Promise((resolve, reject) => {
            autoinc.find({__type: cn}).limit(1).next((err, c) => {
              if (err) {
                return reject(err);
              }

              if (c && c.counters) {
                for (let nm in c.counters) {
                  if (
                    c.counters.hasOwnProperty(nm) &&
                    counters.hasOwnProperty(nm) &&
                    typeof c.counters[nm] === 'number'
                  ) {
                    counters[nm] = c.counters[nm];
                  }
                }
              }

              autoinc.updateOne(
                {__type: cn},
                {
                  $set: {
                    counters: counters,
                    steps: steps,
                    adjust: adjustments
                  }
                },
                {upsert: true},
                (err) => err ? reject(err) :resolve(collection)
              );
            });
          });
        });
      }
      return Promise.resolve(collection);
    };
  }

  /**
   * @param {{}} classMeta
   * @param {String} [namespace]
   * @returns {Promise}
   * @private
   */
  this._defineClass = function (classMeta, namespace) {
    return getMetaTable('meta')
      .then((metaCollection) => {
        namespace = classMeta.namespace || namespace || null;
        classMeta.namespace = namespace;
        return new Promise((resolve, reject) => {
          let chierarchy = [];
          findClassRoot(classMeta, namespace, metaCollection, (err, cm) => {
            if (err) {
              return reject(err);
            }
            createCollection(cm, namespace).
            then(addAutoInc(classMeta)).then(addIndexes(classMeta, cm, namespace, chierarchy)).
            then(function () {
              delete classMeta._id;
              log.log('Регистрирация класса ' + classMeta.name + '@' + namespace);
              metaCollection.updateOne(
                {
                  name: classMeta.name,
                  version: classMeta.version,
                  namespace: namespace
                },
                classMeta,
                {upsert: true},
                (err, result) => {
                  if (err) {
                    return reject(err);
                  }
                  log.log('Класс ' + classMeta.name + '@' + namespace + ' зарегистрирован.');
                  resolve(result);
                }
              );
            }).catch(reject);
            },
            chierarchy);
        });
      });
  };

  this._undefineClass = function (className, version, namespace) {
    return getMetaTable('meta')
      .then((collection) => {
        let cn = parseCanonicalName(className);
        let query = {name: cn.name};
        if (version) {
          query.version = version;
        }
        namespace = cn.namespace || namespace;
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        return new Promise((resolve, reject) => {
          collection.remove(query, (err, cm) => err ? reject(err) : resolve(cm));
        });
      });
  };

  this._defineView = function (viewMeta, className, type, path) {
    viewMeta.type = type;
    viewMeta.className = className;
    viewMeta.path = path || '';
    delete viewMeta._id;

    return getMetaTable('view')
      .then((collection) => {
        return new Promise((resolve, reject) => {
          collection.update(
            {
              type: viewMeta.type,
              className: viewMeta.className,
              path: viewMeta.path,
              version: viewMeta.version
            },
            viewMeta,
            {upsert: true},
            (err, vm) => {
              if (err) {
                return reject(err);
              }
              log.log('Создано представление ' + type +
                ' для класса ' + className + ' и пути навигации ' + viewMeta.path);
              resolve(vm);
            }
          );
      });
    });
  };

  this._undefineView = function (className, type, path, version) {
    return getMetaTable('view')
      .then((collection) => {
        let query = {
          className: className,
          type: type,
          path: path
        };
        if (version) {
          query.version = version;
        }
      return new Promise((resolve, reject) => {
        collection.remove(query, (err, vm) => err ? reject(err) : resolve(vm));
      });
    });
  };

  this._defineNavSection = function (navSection, namespace) {
    return getMetaTable('nav')
      .then((collection) => {
        navSection.itemType = 'section';
        navSection.namespace = navSection.namespace || namespace || null;
        delete navSection._id;
        return new Promise((resolve, reject) => {
          collection.updateOne(
            {
              name: navSection.name,
              itemType: navSection.itemType,
              namespace: navSection.namespace
            },
            navSection,
            {upsert: true},
            (err, ns) => err ? reject(err) : resolve(ns)
          );
        });
      })
      .then(() => {log.log('Создана секция навигации ' + navSection.namespace + '@' + navSection.name);});
  };

  this._undefineNavSection = function (sectionName, namespace) {
    return getMetaTable('nav')
      .then((collection) => {
        let sn = parseCanonicalName(sectionName);
        if (sn.namespace) {
          sectionName = sn.namespace;
          namespace = sn.name;
        }
        let query = {name: sectionName, itemType: 'section'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }

        return new Promise((resolve, reject) => {
          collection.remove(query, (err, nsm) => err ? reject(err) : resolve(nsm));
        });
      });
  };

  this._defineNavNode = function (navNode, navSectionName, namespace) {
    return getMetaTable('nav')
      .then((collection) => {
        navNode.itemType = 'node';
        namespace = navNode.namespace || namespace || null;
        let sectNs = namespace;
        let sn = parseCanonicalName(navSectionName);
        if (sn.namespace) {
          navSectionName = sn.namespace;
          sectNs = sn.name;
        }
        navNode.section = (sectNs ? sectNs + '@' : '') + navSectionName;
        navNode.namespace = namespace;
        delete navNode._id;
        return new Promise((resolve, reject) => {
          collection.updateOne(
            {
              code: navNode.code,
              itemType: navNode.itemType,
              namespace: navNode.namespace
            },
            navNode,
            {upsert: true},
            (err, ns) => {
              if (err) {
                return reject(err);
              }
              log.log('Создан узел навигации ' + navNode.namespace + '@' + navNode.code);
              resolve(ns);
            }
          );
        });
      });
  };

  this._undefineNavNode = function (navNodeName, namespace) {
    return getMetaTable('nav')
      .then((collection) => {
        let nn = parseCanonicalName(navNodeName);
        if (nn.namespace) {
          navNodeName = nn.namespace;
          namespace = nn.name;
        }
        let query = {code: navNodeName, itemType: 'node'};
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        return new Promise((resolve, reject) => {
          collection.remove(query, (err, nnm) => err ? reject(err) : resolve(nnm));
        });
      });
  };

  /**
   * @param {{wfClass: String, name: String, version: String}} wfMeta
   * @param {String} [namespace]
   * @returns {Promise}
   * @private
   */
  this._defineWorkflow = function (wfMeta, namespace) {
    wfMeta.namespace = wfMeta.namespace || namespace || null;
    delete wfMeta._id;

    return getMetaTable('workflow')
      .then((collection) => {
        return new Promise((resolve, reject) => {
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
              log.log('Создан бизнес-процесс ' + wfMeta.name + '@' + wfMeta.namespace + ' для класса ' + wfMeta.wfClass);
              resolve(wf);
            });
        });
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
    return getMetaTable('view')
      .then(function (collection) {
        let cn = parseCanonicalName(className);
        let wn = parseCanonicalName(name);

        if (!cn.namespace) {
          className = cn.name + '@' + namespace;
        }

        let query = {
          wfClass: className,
          name: wn.name
        };

        if (version) {
          query.version = version;
        }

        namespace = wn.namespace || namespace;
        if (namespace) {
          query.namespace = namespace;
        } else {
          query.$or = [{namespace: {$exists: false}}, {namespace: false}];
        }
        return new Promise((resolve, reject) => {
          collection.remove(query, (err, wf) => err ? reject(err) : resolve(wf));
        });
      });
  };

  this._defineUserType = function (userType) {
    return getMetaTable('user_type')
      .then((collection) => {
        return new Promise((resolve, reject) => {
          collection.updateOne(
            {
              name: userType.name,
              namespace: userType.namespace
            },
            userType,
            {upsert: true},
            (err, ns) => err ? reject(err) : resolve(ns)
          );
        });
      });
  };
}

MongoDbSync.prototype = new DbSync();
module.exports = MongoDbSync;
