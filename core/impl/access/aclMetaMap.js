/**
 * Created by kras on 27.02.16.
 */
'use strict';

const AclProvider = require('core/interfaces/AclProvider');
const PropertyTypes = require('core/PropertyTypes');
const Item = require('core/interfaces/DataRepository/lib/Item');
const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const Logger = require('core/interfaces/Logger');
const F = require('core/FunctionCodes');

// jshint maxstatements: 50, maxcomplexity: 20
/**
 * @param {{}} options
 * @param {{}} options.map
 * @param {DataRepository} options.dataRepo
 * @param {AclProvider} options.acl
 * @param {{}} options.accessManager
 * @param {Logger} options.log
 * @constructor
 */
function AclMetaMap(options) {

  if (!options.map) {
    options.map = {};
  }

  /**
   * @param {ClassMeta} cm
   */
  function locateMap(cm) {
    if (options.map.hasOwnProperty(cm.getCanonicalName())) {
      return options.map[cm.getCanonicalName()];
    }
    if (cm.getAncestor()) {
      return locateMap(cm.getAncestor());
    }
    return null;
  }


  /**
   * @param {Item} item
   * @param {Function} cb
   * @param {Boolean} breakOnResult
   * @param {*} result
   */
  function jump(item, cb, breakOnResult, result) {
    let config = locateMap(item.getMetaClass());
    if (config) {
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
                p = p
                  .then(() => options.dataRepo.getAssociationsList(item, j))
                  .catch((err) => {
                    if (options.log instanceof Logger) {
                      options.log.warn(err.message || err);
                    }
                    return [];
                  })
                  .then((coll) => {
                    items.push(...coll);
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

    let p = (item instanceof Item) ?
      Promise.resolve(item) :
      options.dataRepo.getItem(item.cn, item.id);

    return p
      .then((item) => {
        if (!item) {
          return Promise.resolve(result);
        }
        let config = locateMap(item.getMetaClass());
        if (!config) {
          return Promise.resolve(result);
        }

        let sid = item.get(config.sidAttribute);
        let p = (skipCb || !sid) ? Promise.resolve(result) : cb(sid);
        if (!(p instanceof Promise)) {
          p = Promise.resolve(p || result);
        }
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
      })
      .catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
        return result;
      });
  }

  /**
   * @param {String} sid
   * @param {String} cn
   * @param {Array} entries
   * @returns {Function}
     */
  function walkEntry(sid, i, entries, cb, breakOnResult, result) {
    if (i >= entries.length || !entries[i].sidAttribute) {
      return Promise.resolve(result);
    }
    let f = {[F.EQUAL]: ['$' + entries[i].sidAttribute, sid]};
    let jumps = [];
    if (Array.isArray(entries[i].jumps)) {
      entries[i].jumps.forEach((j) => {
        jumps.push(j.split('.'));
      });
    }
    return options.dataRepo.getList(entries[i]._cn, {filter: f, forceEnrichment: jumps})
      .catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
        return [];
      })
      .then((items) => {
        if (!items.length) {
          return Promise.resolve(result);
        }
        return walkItems(items, 0, cb, breakOnResult, true, result)
          .then((result) => {
            if (result && breakOnResult) {
              return result;
            }
            return walkEntry(sid, i + 1, entries, cb, breakOnResult, result);
          });
      });
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
    return walkEntry(sid, 0, entries, cb, breakOnResult);
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
        return walkRelatedSubjects(
          subject,
          sid => options.acl.checkAccess(sid, resource, permissions).then((r) => {can = r;}),
          true
        ).then(() => can);
      });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    const sids = Array.isArray(subject) ? subject.slice(0) : [subject];
    return walkRelatedSubjects(subject, (sid) => {
      sids.push(sid);
    })
      .then(() => options.acl.getPermissions(sids, resources, skipGlobals));
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._getResources = function (subject, permissions) {
    return options.acl.getResources(subject, permissions)
      .then(resources =>
        walkRelatedSubjects(subject,
          sid =>
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
        ).then(() => resources)
      );
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getCoactors = function (subject) {
    return options.acl.getCoactors(subject)
      .then(coactors =>
        walkRelatedSubjects(subject,
          (sid) => {
            if (coactors.indexOf(sid) < 0) {
              coactors.push(sid);
            }
            return options.acl.getCoactors(sid)
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
        ).then(() => coactors)
      );
  };

  this._init = function () {
    if (options.accessManager instanceof RoleAccessManager && typeof options.dataRepo.on === 'function') {
      /**
       * @type {RoleAccessManager}
       */
      let am = options.accessManager;
      let events = [];
      for (let cn in options.map) {
        if (options.map.hasOwnProperty(cn)) {
          let me = options.map[cn];
          if (me.sidAttribute && !me.isEntry && me.createRole) {
            events.push(cn + '.create');
            events.push(cn + '.edit');
          }
        }
      }

      if (events.length) {
        options.dataRepo.on(events, (e) => {
          if (e.item) {
            let me = locateMap(e.item.getMetaClass());
            if (me) {
              // if (e.type === e.item.getClassName() + '.create' || e.updates && e.updates.hasOwnProperty(me.sidAttribute)) {
              let sid = e.item.get(me.sidAttribute);
              if (sid) {
                return am.defineRole(sid, e.item.toString()).then(() => am.assignRoles([sid], [sid])).then(() => null);
              }
              // }
            }
          }
        });
      }
    }
    return Promise.resolve();
  };
}

AclMetaMap.prototype = new AclProvider();

module.exports = AclMetaMap;
