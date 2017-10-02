/**
 * Created by kras on 27.02.16.
 */
'use strict';

const AclProvider = require('core/interfaces/AclProvider');
const PropertyTypes = require('core/PropertyTypes');
const Item = require('core/interfaces/DataRepository/lib/Item');
const merge = require('merge');

// jshint maxstatements: 50, maxcomplexity: 20
/**
 * @param {{}} options
 * @param {{}} options.map
 * @param {DataRepository} options.dataRepo
 * @param {AclProvider} options.acl
 * @constructor
 */
function AclMetaMap(options) {

  if (!options.map) {
    options.map = {};
  }

  /**
   * @param {Item} item
   * @param {Function} cb
   * @param {Boolean} breakOnResult
   * @param {*} result
   */
  function jump(item, cb, breakOnResult, result) {
    if (options.map.hasOwnProperty(item.getClassName())) {
      let config = options.map[item.getClassName()];
      if (Array.isArray(config.jumps)) {
        let items = [];
        let p = Promise.resolve();
        config.jumps.forEach((j) => {
          let prop = item.property(j);
          if (prop) {
            if (prop.meta.type === PropertyTypes.REFERENCE) {
              let d = item.getAggregate(j);
              if (d) {
                items.push(d);
              } else if (item.get(j)) {
                items.push({cn: prop.meta._refClass.getCanonicalName(), id: item.get(j)});
              }
            } else if (prop.meta.type === PropertyTypes.COLLECTION) {
              let d = item.getAggregates(j);
              if (Array.isArray(d)) {
                Array.prototype.push.apply(items, d);
              } else {
                p = p.then(() => options.dataRepo.getAssociationsList(item, j)).then((coll) => {
                  Array.prototype.push.apply(items, coll);
                });
              }
            }
          }
        });
        return p.then(() => walkItems(items, 0, cb, breakOnResult, false, result));
      }
    }
    return Promise.resolve(result);
  }

  function walkItems(items, i, cb, breakOnResult, skipCb, result) {
    if (i >= items.length) {
      return Promise.resolve(result);
    }
    let item = items[i];

    let p = item instanceof Item ? Promise.resolve(item) :
          options.dataRepo.getItem(item.cn, item.id);

    return p
      .then((item) => {
        if (!item) {
          return Promise.resolve(result);
        }
        let p = skipCb ? Promise.resolve(result) : cb(item);
        return p.then((result) => {
          if (result && breakOnResult) {
            return result;
          }
          return jump(item, cb, breakOnResult, result)
            .then((result) => {
              if (result && breakOnResult) {
                return result;
              }
              return walkItems(items, i + 1, cb, breakOnResult, false, result);
            });
        });
      });
  }

  /**
   * @param {String} sid
   * @param {String} cn
   * @param {Array} entries
   * @returns {Function}
     */
  function walkEntry(sid, i, entries, cb, breakOnResult, result) {
    return function () {
      if (i >= entries.length) {
        return Promise.resolve(result);
      }
      let f = {};
      f[entries[i].sidAttribute] = sid;
      let jumps = [];
      if (!breakOnResult && Array.isArray(entries[i].jumps)) {
        entries[i].jumps.forEach((j) => {
          jumps.push(j.split('.'));
        });
      }
      return options.dataRepo.getList(entries[i]._cn, {filter: f, forceEnrichment: jumps})
        .then((items)=>{
          if (!items.length) {
            return Promise.resolve();
          }
          return walkItems(items, 0, cb, breakOnResult, true).then((result) => {
            if (result && breakOnResult) {
              return result;
            }
            return walkEntry(sid, i + 1, entries, cb, breakOnResult, result);
          });
        });
    };
  }

  function walkEntries(sid, cb, breakOnResult) {
    let entries = [];
    for (let cn in options.map) {
      if (options.map.hasOwnProperty(cn)) {
        if (options.map[cn].isEntry) {
          options.map[cn]._cn = cn;
          entries.push(options.map[cn]);
        }
      }
    }
    if (!entries.length) {
      return Promise.resolve();
    }
    return walkEntry(sid, 0, entries, breakOnResult);
  }


  function walkRelatedSubjects(sid, cb, breakOnResult) {
    return walkEntries(sid, cb, breakOnResult);
  }

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
      return options.acl.checkAccess(subject, resource, permissions)
        .then((can) => {
          if (can) {
            return can;
          }
          return walkRelatedSubjects(subject, (sid) => options.acl.checkAccess(sid, resource, permissions), true);
        });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    return options.acl.getPermissions(subject, resources, skipGlobals)
      .then((permissions) => {
        return walkRelatedSubjects(subject,
          (sid) =>
            options.acl.getPermissions(sid, resources, skipGlobals)
              .then((p2) => {
                permissions = merge(permissions, p2);
              })
        )
          .then(() => resources);
      });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._getResources = function (subject, permissions) {
    return options.acl.getResources(subject, permissions)
      .then((resources) => {
        return walkRelatedSubjects(subject,
          (sid) =>
            options.acl.getResources(sid, permissions)
              .then((r2) => {
                if (Array.isArray(r2)) {
                  r2.forEach((r) => {
                    if (resources.indexOf(r) < 0) {
                      resources.push(r);
                    }
                  });
                }
              })
        )
          .then(() => resources);
      });
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getCoactors = function (subject) {
    return options.acl.getCoactors(subject)
      .then((coactors) => {
        return walkRelatedSubjects(subject,
          (sid) => {
            if (coactors.indexOf(sid) < 0) {
              coactors.push(sid);
            }
            options.acl.getCoactors(sid)
              .then((r2) => {
                if (Array.isArray(r2)) {
                  r2.forEach((r) => {
                    if (coactors.indexOf(r) < 0) {
                      coactors.push(r);
                    }
                  });
                }
              });
          }
        )
          .then(() => coactors);
      });
  };
}

AclMetaMap.prototype = new AclProvider();

module.exports = AclMetaMap;
