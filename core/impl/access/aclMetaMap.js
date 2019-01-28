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
 * @param {Calculator} options.calculator
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

  function jumpsForEach (jumps, cb) {
    if (Array.isArray(jumps)) {
      jumps.forEach(cb);
    } else if (jumps && typeof jumps === 'object') {
      for (let j in jumps) {
        cb(j, jumps[j]);
      }
    }
    return;
  }

  function forceEnrichmentFromJumps (jumps) {
    let forceEnrichment = [];
    jumpsForEach(jumps, (jump) => {
      let fe  = jump.split('.');
      if (fe.length) {
        forceEnrichment.push(fe);
      }
    });
    return forceEnrichment;
  }

  /**
   * @param {Item} item
   * @param {Function} cb
   * @param {*} cache
   */
  function jump(item, cb, cache) {
    let config = locateMap(item.getMetaClass());
    if (config) {
      let items = [];
      let p = Promise.resolve();
      jumpsForEach(config.jumps, (j, f) => {
        let prop = item.property(j);
        if (prop) {
          if (prop.meta.type === PropertyTypes.REFERENCE) {
            let d = item.getAggregate(j);
            if (d) {
              items.push(d);
            } else if (item.get(j)) {
              let rc = prop.meta._refClass;

              if (Array.isArray(cache[rc.getCanonicalName()]) && cache[rc.getCanonicalName()].indexOf(item.get(j)) >= 0) {
                return;
              }

              let c = locateMap(rc);
              let opts = {
                filter: f, 
                forceEnrichment: forceEnrichmentFromJumps(c.jumps)
              };
              p = p.then(() => options.dataRepo.getItem(rc.getCanonicalName(), item.get(j), opts))
                .then((item) => {
                  items.push(item);
                })
                .catch((err) => {
                  if (options.log instanceof Logger) {
                    options.log.warn(err.message || err);
                  }
                });
            }
          } else if (prop.meta.type === PropertyTypes.COLLECTION) {
            let d = item.getAggregates(j);
            if (Array.isArray(d)) {
              let ff = options.calculator.parseFormula(f);
              d.forEach((e) => {
                p = p
                .then(() => ff.apply(e))
                .then((allowed) => {
                  if (allowed) {
                    items.push(e);
                  }
                });
              });
            } else {
              let c = locateMap(prop.meta._refClass);
              let opts = {
                filter: f, 
                forceEnrichment: forceEnrichmentFromJumps(c.jumps)
              };
              p = p
                .then(() => options.dataRepo.getAssociationsList(item, j, opts))
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
      return p.then(() => walkItems(items, 0, cb, cache, false));
    }
    return Promise.resolve();
  }

  function walkItems(items, i, cb, cache, skipCb) {
    if (i >= items.length) {
      return Promise.resolve();
    }

    let item = items[i];
    if (Array.isArray(cache[item.getClassName()]) && cache[item.getClassName()].indexOf(item.getItemId()) >= 0) {
      return walkItems(items, i + 1, cb, cache, false);
    }

    return Promise.resolve(item)
      .then((item) => {
        if (!item) {
          return Promise.resolve();
        }
        let config = locateMap(item.getMetaClass());
        if (!config) {
          return Promise.resolve();
        }
        
        let sid = config.sidAttribute ? item.get(config.sidAttribute) : null;
        let p = (skipCb || !sid) ? Promise.resolve() : cb(sid);
        if (!(p instanceof Promise)) {
          p = Promise.resolve(p);
        }
        return p.then(() => {
          if (!Array.isArray(cache[item.getClassName()])) {
            cache[item.getClassName()] = [];
          }
          cache[item.getClassName()].push(item.getItemId());

          return jump(item, cb, cache)
            .then(() => walkItems(items, i + 1, cb, cache, false));
        });
      })
      .catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
        return;
      });
  }

  /**
   * @param {String} sid
   * @param {String} cn
   * @param {Array} entries
   * @param {Function} cb
   * @param {*} cache
   * @returns {Function}
     */
  function walkEntry(sid, i, entries, cb, cache) {
    if (i >= entries.length || !entries[i].sidAttribute) {
      return Promise.resolve();
    }
    let opts = {
      filter: {[F.EQUAL]: ['$' + entries[i].sidAttribute, sid]}, 
      forceEnrichment: forceEnrichmentFromJumps(entries[i].jumps)
    };
    return options.dataRepo.getList(entries[i]._cn, opts)
      .catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
        return [];
      })
      .then((items) => {
        if (!items.length) {
          return Promise.resolve();
        }
        return walkItems(items, 0, cb, cache, true)
          .then(() => walkEntry(sid, i + 1, entries, cb, cache));
      });
  }

  function walkEntries(sid, cb, cache) {
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
    return walkEntry(sid, 0, entries, cb, cache);
  }


  function walkRelatedSubjects(sid, cb) {
    return walkEntries(sid, cb, {});
  }

  /**
   * @param {String | User} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
    return options.acl.checkAccess(subject, resource, permissions);
  };

  /**
   * @param {String | String[] | User} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    return options.acl.getPermissions(subject, resources, skipGlobals);
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._getResources = function (subject, permissions) {
    return options.acl.getResources(subject, permissions);
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
