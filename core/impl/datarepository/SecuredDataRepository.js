/**
 * Created by krasilneg on 20.12.16.
 */
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const Item = DataRepositoryModule.Item;
const Permissions = require('core/Permissions');
const merge = require('merge');
const clone = require('clone');
const PropertyTypes = require('core/PropertyTypes');
// const filterByItemIds = require('core/interfaces/DataRepository/lib/util').filterByItemIds;
const IonError = require('core/IonError');
const Errors = require('core/errors/data-repo');
// const F = require('core/FunctionCodes');

/* jshint maxstatements: 100, maxcomplexity: 100, maxdepth: 30 */
function AclMock() {
  /**
   * @returns {Promise}
   */
  this.checkAccess = function () {
    return new Promise(function (resolve) {
      resolve(true);
    });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this.getPermissions = function (subject, resources) {
    return new Promise(function (resolve) {
      var result = {};
      resources = Array.isArray(resources) ? resources : [resources];
      for (var i = 0; i < resources.length; i++) {
        result[resources[i]] = {};
        result[resources[i]][Permissions.READ] = true;
        result[resources[i]][Permissions.WRITE] = true;
        result[resources[i]][Permissions.DELETE] = true;
        result[resources[i]][Permissions.USE] = true;
        result[resources[i]][Permissions.FULL] = true;
      }
      resolve(result);
    });
  };
}

/**
 * @param {{}} options
 * @param {DataRepository} options.data
 * @param {MetaRepository} options.meta
 * @param {String} [options.roleMap]
 * @param {{}} [options.roleMap]
 * @param {AclProvider} [options.acl]
 * @param {WorkflowProvider} [options.workflow]
 * @param {{}} [options.accessManager]
 * @constructor
 */
function SecuredDataRepository(options) {

  /**
   * @type {DataRepository}
   */
  var dataRepo = options.data;

  /**
   * @type {MetaRepository}
   */
  // var metaRepo = options.meta;

  /**
   * @type {AclProvider}
   */
  var aclProvider = options.acl || new AclMock();

  /**
   * @type {WorkflowProvider}
   */
  var workflow = options.workflow;

  var classPrefix = options.classPrefix || 'c:::';
  var itemPrefix = options.itemPrefix || 'i:::';
  // var attrPrefix = options.attrPrefix || 'a:::';
  var globalMarker = options.globalMarker || '*';

  var rolePermissionCache = {};

  this.init = function () {
    if (options.roleMap && options.accessManager instanceof RoleAccessManager) {
      /**
       * @type {RoleAccessManager}
       */
      let am = options.accessManager;
      let result = Promise.resolve();
      Object.keys(options.roleMap).forEach((cn) => {
        Object.keys(options.roleMap[cn]).forEach((role) => {
          let conf = options.roleMap[cn][role];
          if (conf.resource && conf.resource.id) {
            result = result.then(() => {
              return am
                .defineRole(role, conf.caption)
                .then(() => am.assignRoles([role], [role]))
                .then(() => am.defineResource(conf.resource.id, conf.resource.caption));
            });
          }
        });
      });
      return result;
    }
    return Promise.resolve();
  };

  /**
   * @param {ClassMeta} cm
   */
  function classRoleConfig(cm) {
    let result = null;
    if (cm.getAncestor()) {
      let anc = classRoleConfig(cm.getAncestor());
      if (anc) {
        result = merge(true, anc);
      }
    }
    if (options.roleMap && options.roleMap.hasOwnProperty(cm.getCanonicalName())) {
      result = merge(result || {}, options.roleMap[cm.getCanonicalName()]);
    }
    return result;
  }

  /*
   * @param {String[]} check
   * @param {String[]} resources
   * @param {ClassMeta} cm

  function classResources(check, resources, cm) {
    check.push(cm.getCanonicalName());
    resources.push(classPrefix + cm.getCanonicalName());
    let descendants = cm.getDescendants();
    for (let i = 0; i < descendants.length; i++) {
      classResources(check, resources, descendants[i]);
    }
  }
   */
  /*
   * @param {String} uid
   * @param {String} cn
   * @param {{} | null} filter
   * @private

  function exclude(uid, cn, filter, classPermissions) {
    return aclProvider.getResources(uid, Permissions.READ)
      .then((explicit) => {
        if (explicit.indexOf(globalMarker) >= 0) {
          if (classPermissions) {classPermissions[Permissions.READ] = true;}
          return Promise.resolve(filter);
        }

        let cm = metaRepo.getMeta(cn);
        let check = [];
        let resources = [];
        classResources(check, resources, cm);
        let items = [];
        for (let i = 0; i < explicit.length; i++) {
          if (explicit[i].substr(0, itemPrefix.length) === itemPrefix) {
            let tmp = explicit[i].replace(itemPrefix, '').split('@');
            if (tmp.length > 1) {
              if (check.indexOf(tmp[0]) >= 0) {
                items.push(tmp[1]);
              }
            }
          }
        }

        return aclProvider.getPermissions(uid, resources).then((permissions) => {
          let exc = [];
          for (let i = 0; i < check.length; i++) {
            if (!permissions[resources[i]] || !permissions[resources[i]][Permissions.READ]) {
              exc.push(check[i]);
            }
          }

          if (exc.length) {
            let cf = {[F.NOT]: [{[F.IN]: ['$_class', exc]}]};
            if (items.length) {
              permissions[classPrefix + cm.getCanonicalName()] = permissions[classPrefix + cm.getCanonicalName()] || {};
              permissions[classPrefix + cm.getCanonicalName()][Permissions.READ] = true;
              cf = {[F.OR]: [cf, filterByItemIds(options.keyProvider, cm, items)]};
            }
            if (!filter) {
              filter = cf;
            } else {
              filter = {[F.AND]: [cf, filter]};
            }
          }

          merge(classPermissions || {}, permissions[classPrefix + cm.getCanonicalName()] || {});
          return Promise.resolve(filter);
        });
      });
  }
   */

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @param {{}} [options]
   * @private
   * @returns {Item | null}
   */
  this._wrap = function (className, data, version, options) {
    return dataRepo.wrap(className, data, version, options);
  };

  /*
  function cn(obj) {
    let cn;
    if (typeof obj === 'string') {
      cn = obj;
    } else if (obj instanceof Item) {
      cn = obj.getClassName();
    }
    if (!cn) {
      throw new Error('No class info passed');
    }
    return cn;
  }
   */

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object, user: User}} options
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    return dataRepo.getCount(obj, options);
  };

  /**
   * @param {Item} item
   * @return {Item}
   */
  function cenzor(item, processed) {
    if (!item.permissions[Permissions.READ]) {
      item.emptify();
      return item;
    }
    processed = processed || {};
    let props = item.getProperties();
    Object.values(props).forEach((p) => {
      if (p.meta.type === PropertyTypes.REFERENCE || p.meta.type === PropertyTypes.COLLECTION) {
        let v = p.evaluate();
        if (v) {
          v = Array.isArray(v) ? v : [v];
          v.forEach((item) => {
            if (item instanceof Item) {
              if (!processed[item.getClassName() + '@' + item.getItemId()]) {
                processed[item.getClassName() + '@' + item.getItemId()] = true;
                cenzor(item, processed);
              }
            }
          });
        }
      }
    });
    return item;
  }

  /**
   *
   * @param {Item} item
   * @param {{}} permissions
   * @param {{}} permMap
   */
  function itemToPermMap(item, permissions, permMap) {
    if (item && item.getItemId()) {
      permMap[item.getClassName() + '@' + item.getItemId()] = merge(true,
        permissions[itemPrefix + item.getClassName() + '@' + item.getItemId()] || {},
        permissions[classPrefix + item.getClassName()] || {},
        permissions[globalMarker] || {}
      );

      permMap[item.getClassName() + '@' + item.getItemId()].__attr =
       attrPermissions(item, permMap[item.getClassName() + '@' + item.getItemId()], permissions) || {};

      let props = item.getProperties();
      Object.values(props).forEach((p) => {
        if (p.meta.type === PropertyTypes.REFERENCE || p.meta.type === PropertyTypes.COLLECTION) {
          let v = p.evaluate();
          if (v) {
            if (!Array.isArray(v)) {
              v = [v];
            }
            v.forEach((item) => {
              if (item instanceof Item) {
                if (!permMap[item.getClassName() + '@' + item.getItemId()]) {
                  itemToPermMap(item, permissions, permMap);
                }
              }
            });
          }
        }
      });
    }
  }

  function getPermMap(list, options) {
    if (!list.length) {
      return Promise.resolve({});
    }
    let resources = [globalMarker];
    list.forEach((item) => {
      if (item.getItemId()) {
        resources.push(classPrefix + item.getClassName());
        resources.push(itemPrefix + item.getClassName() + '@' + item.getItemId());
        resources.push(...attrResources(item));
      }
    });

    return aclProvider.getPermissions(options.user.id(), resources, true).then((permissions) => {
      let permMap = {};
      list.forEach((item) => {
        itemToPermMap(item, permissions, permMap);
      });
      return permMap;
    });
  }

  /**
   * @param {{}} moptions
   * @returns {function()}
   */
  function listCenzor(moptions) {
    return (list) => {
      let clearedList = [];
      clearedList.total = list.total;
      return getPermMap(list, moptions)
        .then((permMap) => {
          let result = Promise.resolve();
          list.forEach(
            (item) => {
              result = result.then(() => setItemPermissions(moptions, permMap)(item));
            }
          );
          list.forEach(
            (item) => {
              result = result.then(() => {
                clearedList.push(cenzor(item));
              });
            }
          );
          return result.then(() => clearedList);
        });
    };
  }

  /**
   * @param {String | Item} obj
   * @param {{user: User}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @returns {Promise}
   */
  this._getList = function (obj, moptions) {
    let opts = clone(moptions);
    let cm = options.meta.getMeta(obj);
    roleEnrichment(cm, opts);
    return dataRepo.getList(obj, opts).then(listCenzor(moptions));
  };

  /**
   * @param {String} className
   * @param {{uid: String}} options
   * @param {{}} [options.expressions]
   * @param {{}} [options.filter]
   * @param {{}} [options.groupBy]
   * @returns {Promise}
   */
  this._aggregate = function (className, options) {
    return dataRepo.aggregate(className, options);
  };

  /**
   * @param {Item} item
   * @returns {Array}
   */
  function attrResources(item, processed) {
    processed = processed || {};
    let props = item.getProperties();
    let result = [];
    for (let nm in props) {
      if (props.hasOwnProperty(nm)) {
        let p = props[nm];
        if (p.getType() === PropertyTypes.REFERENCE) {
          let ri = p.evaluate();
          result.push(classPrefix + p.meta._refClass.getCanonicalName());
          if (ri instanceof Item) {
            result.push(classPrefix + ri.getClassName());
            result.push(itemPrefix + ri.getClassName() + '@' + ri.getItemId());
            if (!processed[ri.getClassName() + '@' + ri.getItemId()]) {
              processed[ri.getClassName() + '@' + ri.getItemId()] = true;
              result.push(...attrResources(ri, processed));
            }
          } else if (p.getValue()) {
            result.push(itemPrefix + p.meta._refClass.getCanonicalName() + '@' + p.getValue());
          }
        } else if (p.getType() === PropertyTypes.COLLECTION) {
          result.push(classPrefix + p.meta._refClass.getCanonicalName());
        }
      }
    }
    return result;
  }

  /**
   * @param {Item} item
   * @param {{}} permissions
   * @returns {{}}
   */
  function attrPermissions(item, ipermissions, permissions, processed) {
    processed = processed || {};
    let props = item.getProperties();
    let result = {};
    let global = permissions[globalMarker] || {};
    let iperm = merge(true, ipermissions || {}, global);
    for (let nm in props) {
      if (props.hasOwnProperty(nm)) {
        let p = props[nm];
        result[p.getName()] = {};
        if (p.getType() === PropertyTypes.REFERENCE) {
          let ri = p.evaluate();
          let cn = ri ? ri.getClassName() : p.meta._refClass.getCanonicalName();
          let tmp = itemPrefix + cn + '@' + p.getValue();
          let rperm = merge(true, permissions[tmp] || {}, global);
          let rcperm = merge(true, permissions[classPrefix + cn] || {}, global);

          /*
          if (ri instanceof Item) {
            tmp = itemPrefix + ri.getClassName() + '@' + ri.getItemId();
            rperm = merge(true, permissions[tmp] || {}, rperm);
            rcperm = merge(true, permissions[classPrefix + ri.getClassName()] || {}, rcperm);
            if (!processed[ri.getClassName() + '@' + ri.getItemId()]) {
              processed[ri.getClassName() + '@' + ri.getItemId()] = true;
              ri.attrPermissions = attrPermissions(ri, merge(true, rperm, rcperm), permissions, processed);
            }
          }
           */
          result[p.getName()][Permissions.READ] =
            iperm[Permissions.READ] &&
            (rperm[Permissions.READ] || rcperm[Permissions.READ]);

          if (p.meta.backRef) {
            result[p.getName()][Permissions.WRITE] = iperm[Permissions.WRITE] &&
              (
                rperm[Permissions.WRITE] ||
                rcperm[Permissions.WRITE]
              );
          } else {
            result[p.getName()][Permissions.WRITE] = iperm[Permissions.WRITE];
          }

          result[p.getName()][Permissions.ATTR_CONTENT_CREATE] = rcperm[Permissions.USE];

          result[p.getName()][Permissions.ATTR_CONTENT_VIEW] = rcperm[Permissions.READ] || rperm[Permissions.READ];

          result[p.getName()][Permissions.ATTR_CONTENT_EDIT] = rcperm[Permissions.WRITE] || rperm[Permissions.WRITE];

          result[p.getName()][Permissions.ATTR_CONTENT_DELETE] = rcperm[Permissions.DELETE] || rperm[Permissions.DELETE];

        } else if (p.getType() === PropertyTypes.COLLECTION) {
          let rcperm = merge(true, permissions[classPrefix + p.meta._refClass.getCanonicalName()] || {}, global);
          result[p.getName()][Permissions.READ] = iperm[Permissions.READ] && rcperm[Permissions.READ];

          result[p.getName()][Permissions.WRITE] = iperm[Permissions.WRITE] && rcperm[Permissions.WRITE];

          result[p.getName()][Permissions.ATTR_CONTENT_CREATE] = iperm[Permissions.WRITE] && rcperm[Permissions.USE];

          result[p.getName()][Permissions.ATTR_CONTENT_VIEW] = true;

          result[p.getName()][Permissions.ATTR_CONTENT_EDIT] = rcperm[Permissions.WRITE];

          result[p.getName()][Permissions.ATTR_CONTENT_DELETE] = iperm[Permissions.WRITE] && rcperm[Permissions.DELETE];
        } else {
          result[p.getName()][Permissions.READ] = iperm[Permissions.READ];
          result[p.getName()][Permissions.WRITE] = iperm[Permissions.WRITE];
        }
      }
    }
    return result;
  }

  /**
   * @param {{user: User}} options
   * @param {{}} [permMap]
   * @returns {Promise.<TResult>}
   */
  function setItemPermissions(options, permMap, noDrill) {
    /**
     * @param {Item} item
     */
    return function (item) {
      if (!item || (item.permissions && item.attrPermissions)) {
        return Promise.resolve(item);
      }
      let roleConf = classRoleConfig(item.getMetaClass());
      let p;
      let statics = permMap && permMap[item.getClassName() + '@' + item.getItemId()];

      if (!statics) {
        p = aclProvider.getPermissions(
          options.user.id(), [
            globalMarker,
            classPrefix + item.getClassName(),
            itemPrefix + item.getClassName() + '@' + item.getItemId()
          ],
          true)
          .then((permissions) => {
            return merge(true,
              permissions[itemPrefix + item.getClassName() + '@' + item.getItemId()] || {},
              permissions[classPrefix + item.getClassName()] || {},
              permissions[globalMarker] || {}
            );
          });
      } else {
        let perms = clone(statics);
        delete perms.__attr;
        p = Promise.resolve(perms);
      }
      return p
        .then((permissions) => {
          item.permissions = permissions;
          if (
            item.permissions[Permissions.FULL] ||
            (
              item.permissions[Permissions.READ] &&
              item.permissions[Permissions.WRITE] &&
              item.permissions[Permissions.DELETE]
            )
          ) {
            return;
          }
          if (roleConf) {
            let result = Promise.resolve();
            Object.keys(roleConf).forEach((role) => {
              let resid = roleConf[role].resource && roleConf[role].resource.id || (classPrefix + item.getClassName());
              if (roleConf[role].attribute) {
                let actor = item.property(roleConf[role].attribute).evaluate();
                if (!actor) {
                  actor = item.property(roleConf[role].attribute).getValue();
                }
                if (actor) {
                  actor = Array.isArray(actor) ? actor : [actor];
                  actor.forEach((actor) => {
                    if (actor instanceof Item) {
                      actor = actor.getItemId();
                    }
                    if (options.user.isMe(actor)) {
                      result = result
                        .then(() => {
                          if (rolePermissionCache[role] && rolePermissionCache[role][resid]) {
                            return rolePermissionCache[role];
                          }
                          return aclProvider.getPermissions(role, resid, true);
                        })
                        .then((permissions) => {
                          if (!rolePermissionCache[role]) {
                            rolePermissionCache[role] = {};
                          }
                          rolePermissionCache[role][resid] = permissions[resid] || {};
                          if (permissions[resid]) {
                            for (let p in permissions[resid]) {
                              if (permissions[resid].hasOwnProperty(p)) {
                                if (!item.permissions[p]) {
                                  item.permissions[p] = permissions[resid][p];
                                }
                              }
                            }
                          }
                        });
                    }
                  });
                }
              }
            });
            return result;
          }
        })
        .then(() =>
          workflow ?
            workflow.getStatus(item, options)
              .then((status) => {
                item.permissions = merge(false, true, item.permissions || {}, status.itemPermissions);
                item.attrPermissions = status.propertyPermissions || {};
              }) :
            Promise.resolve()
        )
        .then(() => noDrill ? null :
          ((statics && statics.__attr) ?
            clone(statics.__attr) :
            aclProvider.getPermissions(options.user.id(), attrResources(item)).then((ap) => attrPermissions(item, item.permissions, ap))))
        .then((ap) => {
          item.attrPermissions = merge(false, true, ap || {}, item.attrPermissions);
          if (!noDrill && item.permissions[Permissions.READ]) {
            let props = item.getProperties();
            let items = [];
            Object.values(props).forEach((p) => {
              if (p.meta.type === PropertyTypes.REFERENCE) {
                let ri = p.evaluate();
                if (ri instanceof Item) {
                  items.push(ri);
                }
              } else if (p.meta.type === PropertyTypes.COLLECTION) {
                let collection = p.evaluate();
                if (Array.isArray(collection)) {
                  items.push(...collection);
                }
              }
            });

            if (Array.isArray(items) && items.length) {
              return (
                permMap ? Promise.resolve(clone(permMap)) : getPermMap(items, options)
              ).then((permMap) => {
                let w1 = Promise.resolve();
                items.forEach((ri) => {
                  if (ri.getItemId()) {
                    w1 = w1.then(() => setItemPermissions(options, permMap)(ri));
                  }
                });
                return w1;
              });
            }
          }
        })
        .then(() => item);
    };
  }

  /**
   * @param {ClassMeta} cm
   * @param {Array} path
   */
  function findPm(cm, path) {
    let c = cm;
    for (let i = 0; i < path.length; i++) {
      let pm = c.getPropertyMeta(path[i]);
      if (!pm) {
        break;
      }
      if (i === path.length - 1) {
        return pm;
      }
      if (!pm._refClass) {
        break;
      }
      c = pm._refClass;
    }
    return null;
  }

  /**
   * @param {ClassMeta} cm
   * @param {{}} opts
   * @returns {*}
   */
  function roleEnrichment(cm, opts) {
    let roleConf = classRoleConfig(cm);
    if (roleConf) {
      let fe = Array.isArray(opts.forceEnrichment) ? opts.forceEnrichment.slice(0) : [];
      opts.forceEnrichment = opts.forceEnrichment || [];

      fe.forEach((elp) => {
        if (Array.isArray(elp)) {
          for (let i = 0; i < elp.length; i++) {
            let tmp = elp.slice(0, i);
            let pm = findPm(cm, tmp);
            if (pm && (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION)) {
              let sub = {};
              roleEnrichment(pm._refClass, sub);
              if (Array.isArray(sub.forceEnrichment)) {
                for (let j = 0; j < sub.forceEnrichment.length; j++) {
                  opts.forceEnrichment.push(tmp.concat(sub.forceEnrichment[j]));
                }
              }
            }
          }
        }
      });

      for (let role in roleConf) {
        if (roleConf.hasOwnProperty(role)) {
          if (roleConf[role].attribute) {
            let a = roleConf[role].attribute.split('.');
            let p = cm.getPropertyMeta(a[0]);
            if (p.type !== PropertyTypes.REFERENCE && p.type !== PropertyTypes.COLLECTION) {
              continue;
            }
            if (p.type === PropertyTypes.REFERENCE) {
              if (a.length === 1) {
                a = [];
              }
            }
            if (a.length) {
              opts.forceEnrichment.push(a);
            }
          }
        }
      }
    }
    return opts;
  }

  function checkReadPermission(item) {
    if (item && !item.permissions[Permissions.READ]) {
      throw new IonError(Errors.PERMISSION_LACK);
    }
    return item;
  }

  function getItem(obj, id, moptions) {
    let opts = clone(moptions);
    let cm = obj instanceof Item ? obj.getMetaClass() : options.meta.getMeta(obj);
    roleEnrichment(cm, opts);
    return dataRepo.getItem(obj, id || '', opts)
      .then((item) => item ?
        getPermMap([item], moptions)
          .then((permMap) => setItemPermissions(opts, permMap)(item)) :
        item
      );
  }

  /**
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{uid: String}} options
   * @param {Number} [options.nestingDepth]
   */
  this._getItem = function (obj, id, moptions) {
    return getItem(obj, id, moptions).then(checkReadPermission);
  };

  /**
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger | Function} [changeLogger]
   * @param {{user: User}} options
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, moptions) {
    return aclProvider.checkAccess(moptions.user.id(), classPrefix + classname, [Permissions.USE])
      .then(function (accessible) {
        if (accessible) {
          let opts = clone(moptions);
          let cm = options.meta.getMeta(classname);
          roleEnrichment(cm, opts);
          return dataRepo.createItem(classname, data, version, changeLogger, opts)
            .then(setItemPermissions(opts))
            .then(checkReadPermission);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  function checkWritePermission(classname, id, moptions) {
    return aclProvider.getPermissions(moptions.user.id(), [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then((permissions) => {
        let accessible = permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.WRITE] ||
          permissions[itemPrefix + classname + '@' + id] &&
          permissions[itemPrefix + classname + '@' + id][Permissions.WRITE];
        let cm = options.meta.getMeta(classname);
        let roleConf = classRoleConfig(cm);
        if (accessible || !workflow && !roleConf) {
          return accessible;
        }
        return getItem(classname, id, moptions)
          .then((item) => {
            if (!item) {
              return false;
            }
            return item.permissions[Permissions.WRITE];
          });
      });
  }

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._editItem = function (classname, id, data, changeLogger, moptions) {
    let opts = clone(moptions);
    return checkWritePermission(classname, id, opts)
      .then((writable) => {
        if (writable) {
          let cm = options.meta.getMeta(classname);
          roleEnrichment(cm, opts);
          return dataRepo.editItem(classname, id, data, changeLogger, opts)
            .then(setItemPermissions(opts))
            .then(checkReadPermission);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.autoAssign]
   * @returns {Promise}
   */
  this._saveItem = function (classname, id, data, version, changeLogger, moptions) {
    let opts = clone(moptions);
    return checkWritePermission(classname, id, opts)
      .then(function (writable) {
        if (writable) {
          let cm = options.meta.getMeta(classname);
          roleEnrichment(cm, opts);
          return dataRepo.saveItem(classname, id, data, version, changeLogger, opts)
            .then(setItemPermissions(opts))
            .then(checkReadPermission);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  function checkDeletePermission(classname, id, moptions) {
    return aclProvider.getPermissions(moptions.user.id(), [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        let accessible = permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.DELETE] ||
          permissions[itemPrefix + classname + '@' + id] &&
          permissions[itemPrefix + classname + '@' + id][Permissions.DELETE];
        let cm = options.meta.getMeta(classname);
        let roleConf = classRoleConfig(cm);
        if (accessible || !workflow && !roleConf) {
          return accessible;
        }
        return getItem(classname, id, moptions)
          .then((item) => {
            if (!item) {
              return false;
            }
            return item.permissions[Permissions.DELETE];
          });
      });
  }

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return checkDeletePermission(classname, id, options)
      .then((deletable) => {
        if (deletable) {
          return dataRepo.deleteItem(classname, id, changeLogger);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };


  function checkCollectionWriteAccess(master, details, options) {
    return setItemPermissions(options, null, true)(master)
      .then((m) => {
        if (!m.permissions[Permissions.WRITE]) {
          return false;
        }
        let p = Promise.resolve();
        let breaker = '_____UNUSABLE____';
        details.forEach(function (d) {
          p = p.then(() => setItemPermissions(options, null, true)(d));
          p = p.then((di) => {
            if (!di.permissions[Permissions.USE]) {
              return Promise.reject(breaker);
            }
            return Promise.resolve();
          });
        });
        return p.catch((e) => {
          return e === breaker ? Promise.resolve(false) : Promise.reject(e);
        }).then(() => true);
      });
  }

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._put = function (master, collection, details, changeLogger, options) {
    if (!details.length) {
      return Promise.resolve();
    }
    return checkCollectionWriteAccess(master, details, options)
      .then((writable) => {
        if (writable) {
          return dataRepo.put(master, collection, details, changeLogger);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._eject = function (master, collection, details, changeLogger, options) {
    if (!details.length) {
      return Promise.resolve();
    }
    return checkCollectionWriteAccess(master, details, options)
      .then((writable) => {
        if (writable) {
          return dataRepo.eject(master, collection, details, changeLogger);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{user: User}} options
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this._getAssociationsList = function (master, collection, options) {
    return setItemPermissions(options, null, true)(master)
      .then(function (m) {
        if (m.permissions[Permissions.READ]) {
          return dataRepo.getAssociationsList(master, collection, options).then(listCenzor(options));
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   *
   * @param {Item} master
   * @param {String} collection
   * @param {{user: User}} options
   * @param {{}} [options.filter]
   * @returns {Promise}
   */
  this._getAssociationsCount = function (master, collection, options) {
    return setItemPermissions(options, null, true)(master)
      .then(function (m) {
        if (m.permissions[Permissions.READ]) {
          return dataRepo.getAssociationsCount(master, collection, options);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {Number} [options.nestingDepth]
   * @param {String[][]} [options.forceEnrichment]
   * @param {Boolean} [options.skipResult]
   * @param {User} [options.user]
   * @returns {Promise}
   */
  this._bulkEdit = function (classname, data, options) {
    return aclProvider.getPermissions(options.user.id(), [classPrefix + classname])
      .then(function (permissions) {
        if (
          permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.WRITE]
        ) {
          return dataRepo.bulkEdit(classname, data, options);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  /**
   * @param {String} classname
   * @param {{}} [options]
   * @param {Object} [options.filter]
   * @param {User} [options.user]
   * @returns {Promise}
   */
  this._bulkDelete = function (classname, options) {
    return aclProvider.getPermissions(options.user.id(), [classPrefix + classname])
      .then(function (permissions) {
        if (
          permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.DELETE]
        ) {
          return dataRepo.bulkDelete(classname, options);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };
}

SecuredDataRepository.prototype = new DataRepository();
module.exports = SecuredDataRepository;
