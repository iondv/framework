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

  function processJumps(jumps, cb) {
    if (Array.isArray(jumps)) {
      jumps.forEach(cb);
    } else if (jumps && typeof jumps === 'object') {
      for (let j in jumps) {
        cb(j, jumps[j]);
      }
    }
    return;
  }

  function jumpEnrichment(jumps) {
    let forceEnrichment = [];
    processJumps(jumps, (jump) => {
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
      processJumps(config.jumps, (j, f) => {
        let prop = item.property(j);
        if (prop) {
          if (prop.meta.type === PropertyTypes.REFERENCE) {
            let rid = item.get(j);
            if (!rid) {
              return;
            }
            let d = item.getAggregate(j);
            let rc = prop.meta._refClass;
            if (!(d instanceof Item)) {
              if (cache[rc.getCanonicalName()] && (cache[rc.getCanonicalName()][rid] instanceof Item)) {
                d = cache[rc.getCanonicalName()][rid];
              }
            }

            let c = locateMap((d instanceof Item) ? d.getMetaClass() : rc);
            let opts = {
              filter: f,
              forceEnrichment: jumpEnrichment(c.jumps)
            };

            if (d instanceof Item) {
              p = p.then(() => options.dataRepo.getItem(d, null, opts));
            } else if (item.get(j)) {
              p = p.then(() => options.dataRepo.getItem(rc.getCanonicalName(), rid, opts));
            }

            p = p
              .then((item) => {
                items.push(item);
              })
              .catch((err) => {
                if (options.log instanceof Logger) {
                  options.log.warn(err.message || err);
                }
              });
          } else if (prop.meta.type === PropertyTypes.COLLECTION) {
            let d = item.getAggregates(j);
            if (Array.isArray(d)) {
              let ff = options.calculator.parseFormula(f);
              d.forEach((e) => {
                if (e instanceof Item) {
                  let c = locateMap(e.getMetaClass());
                  let opts = {
                    forceEnrichment: c ? jumpEnrichment(c.jumps) : []
                  };
                  p = p
                    .then(() => options.dataRepo.getItem(e, null, opts))
                    .then(e => ff.apply(e))
                    .then((allowed) => {
                      if (allowed) {
                        items.push(e);
                      }
                    });
                }
              });
            } else {
              let c = locateMap(prop.meta._refClass);
              let opts = {
                filter: f,
                forceEnrichment: jumpEnrichment(c.jumps)
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
      return p.then(() => walkItems(items, cb, cache, false));
    }
    return Promise.resolve();
  }

  function walkItems(items, cb, cache, skipCb) {
    let p = Promise.resolve();
    items.forEach((item) => {
      p = p.then(() => {
        let config = locateMap(item.getMetaClass());
        if (!config) {
          return;
        }
        if (!cache[item.getClassName()]) {
          cache[item.getClassName()] = {};
        }
        if (!cache[item.getClassName()][item.getItemId()]) {
          cache[item.getClassName()][item.getItemId()] = item;

          let sid = config.sidAttribute ? item.get(config.sidAttribute) : null;
          let cbr = (skipCb || !sid) ? Promise.resolve() : cb(sid);
          if (!(cbr instanceof Promise)) {
            cbr = Promise.resolve(cbr);
          }
          return cbr.then(() => jump(item, cb, cache));
        }
      }).catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
      });
    });
    return p;
  }

  /**
   * @param {String} sid
   * @param {String} cn
   * @param {Array} entries
   * @param {Function} cb
   * @param {*} cache
   * @returns {Function}
     */
  function walkEntry(sid, entry, cb, cache) {
    let opts = {
      filter: {[F.EQUAL]: ['$' + entry.sidAttribute, sid]},
      forceEnrichment: jumpEnrichment(entry.jumps)
    };
    return options.dataRepo.getList(entry._cn, opts)
      .catch((err) => {
        if (options.log instanceof Logger) {
          options.log.warn(err.message || err);
        }
        return [];
      })
      .then(items => items.length ? walkItems(items, cb, cache, false) : null);
  }

  function walkEntries(sid, cb, cache) {
    let p = Promise.resolve();
    Object.keys(options.map).forEach((cn) => {
      if (options.map[cn].isEntry) {
        options.map[cn]._cn = cn;
        p = p.then(() => walkEntry(sid, options.map[cn], cb, cache));
      }
    });
    return p;
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
