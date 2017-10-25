/**
 * Created by krasilneg on 20.12.16.
 */
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const DataRepositoryModule = require('core/interfaces/DataRepository');
const DataRepository = DataRepositoryModule.DataRepository;
const Item = DataRepositoryModule.Item;
const Permissions = require('core/Permissions');
const merge = require('merge');
const PropertyTypes = require('core/PropertyTypes');
const filterByItemIds = require('core/interfaces/DataRepository/lib/util').filterByItemIds;
const IonError = require('core/IonError');
const Errors = require('core/errors/data-repo');

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
 * @param {AclProvider} [options.acl]
 * @param {WorkflowProvider} [options.workflow]
 * @constructor
 */
function SecuredDataRepository(options) {

  var _this = this;

  /**
   * @type {DataRepository}
   */
  var dataRepo = options.data;

  /**
   * @type {MetaRepository}
   */
  var metaRepo = options.meta;

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

  /**
   * @param {String[]} check
   * @param {String[]} resources
   * @param {ClassMeta} cm
   */
  function classResources(check, resources, cm) {
    check.push(cm.getCanonicalName());
    resources.push(classPrefix + cm.getCanonicalName());
    var descendants = cm.getDescendants();
    for (var i = 0; i < descendants.length; i++) {
      classResources(check, resources, descendants[i]);
    }
  }

  /**
   * @param {String} uid
   * @param {String} cn
   * @param {{} | null} filter
   * @private
   */
  function exclude(uid, cn, filter, classPermissions) {
    return aclProvider.getResources(uid, Permissions.READ)
      .then(function (explicit) {
        if (explicit.indexOf(globalMarker) >= 0) {
          if (classPermissions) {classPermissions[Permissions.READ] = true;}
          return Promise.resolve(filter);
        }

        var cm = metaRepo.getMeta(cn);
        var check = [];
        var resources = [];
        classResources(check, resources, cm);
        var items = [];
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

        return aclProvider.getPermissions(uid, resources).then(function (permissions) {
          var exc = [];
          for (let i = 0; i < check.length; i++) {
            if (!permissions[resources[i]] || !permissions[resources[i]][Permissions.READ]) {
              exc.push(check[i]);
            }
          }

          if (exc.length) {
            let cf = {_class: {$not: {$in: exc}}};
            if (items.length) {
              permissions[classPrefix + cm.getCanonicalName()] = permissions[classPrefix + cm.getCanonicalName()] || {};
              permissions[classPrefix + cm.getCanonicalName()][Permissions.READ] = true;
              cf = {$or: [cf, filterByItemIds(options.keyProvider, cm, items)]};
            }
            if (!filter) {
              filter = cf;
            } else {
              filter = {$and: [cf, filter]};
            }
          }

          merge(classPermissions || {}, permissions[classPrefix + cm.getCanonicalName()] || {});
          return Promise.resolve(filter);
        });
      });
  }

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

  function cn(obj) {
    var cn;
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

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object, user: User}} options
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    var cname = cn(obj);
    return exclude(options.user.id(), cname, options.filter).then(
      function (filter) {
        options.filter = filter;
        return dataRepo.getCount(obj, options);
      }
    );
  };

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
  this._getList = function (obj, options) {
    var cname = cn(obj);
    var listPermissions = {};
    return exclude(options.user.id(), cname, options.filter, listPermissions)
      .then(
        function (filter) {
          options.filter = filter;
          return dataRepo.getList(obj, options);
        }
      )
      .then(function (list) {
        list.permissions = listPermissions;
        return Promise.resolve(list);
      });
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
    return exclude(options.user, className, options.filter).then(
      function (filter) {
        options.filter = filter;
        return dataRepo.aggregate(className, options);
      }
    );
  };

  /**
   * @param {Item} item
   * @returns {Array}
   */
  function attrResources(item) {
    var props = item.getProperties();
    var p, ri;
    var result = [];
    for (var nm in props) {
      if (props.hasOwnProperty(nm)) {
        p = props[nm];
        if (p.getType() === PropertyTypes.REFERENCE) {
          result.push(classPrefix + p.meta._refClass.getCanonicalName());
          ri = p.evaluate();
          if (ri instanceof Item) {
            result.push(itemPrefix + ri.getClassName() + '@' + ri.getItemId());
            Array.prototype.push.apply(result, attrResources(ri));
          } else {
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
  function attrPermissions(item, permissions) {
    let props = item.getProperties();
    let result = {};
    let iperm = item.permissions || {};
    for (let nm in props) {
      if (props.hasOwnProperty(nm)) {
        let p = props[nm];
        result[p.getName()] = {};
        if (p.getType() === PropertyTypes.REFERENCE) {
          let ri = p.evaluate();
          let tmp = itemPrefix + p.meta._refClass.getCanonicalName() + '@' + p.getValue();
          if (ri instanceof Item) {
            tmp = itemPrefix + ri.getClassName() + '@' + ri.getItemId();
            if (!ri.permissions) {
              ri.permissions =
                merge(true, permissions[tmp] || {}, permissions[classPrefix + p.meta._refClass.getCanonicalName()]);
            }
            ri.attrPermissions = attrPermissions(ri, permissions);
          }

          let rperm = permissions[tmp] || {};
          let rcperm = permissions[classPrefix + p.meta._refClass.getCanonicalName()] || {};

          result[p.getName()][Permissions.READ] =
            iperm[Permissions.READ] &&
            rcperm[Permissions.READ];

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
          let rcperm = permissions[classPrefix + p.meta._refClass.getCanonicalName()] || {};
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
   * @param {Item} item
   * @param {{user: User}} options
   * @returns {Promise.<TResult>}
   */
  function setItemPermissions(options) {
    return function (item) {
      if (!item) {
        return Promise.resolve(item);
      }
      return aclProvider.getPermissions(
        options.user.id(), [
          classPrefix + item.getClassName(),
          itemPrefix + item.getClassName() + '@' + item.getItemId()
        ])
        .then(function (permissions) {
          item.permissions = merge(
            permissions[itemPrefix + item.getClassName() + '@' + item.getItemId()] || {},
            permissions[classPrefix + item.getClassName()] || {}
          );
          return aclProvider.getPermissions(options.user.id(), attrResources(item));
        }).then(function (ap) {
          item.attrPermissions = attrPermissions(item, ap);
          if (!workflow) {
            return item;
          }
          return workflow.getStatus(item, options).then(function (status) {
            item.permissions = merge(false, true, item.permissions || {}, status.itemPermissions);
            item.attrPermissions = merge(false, true, item.attrPermissions || {}, status.propertyPermissions);
            return item;
          });
        });
    };
  }

  /**
   *
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{uid: String}} options
   * @param {Number} [options.nestingDepth]
   */
  this._getItem = function (obj, id, options) {
    return dataRepo.getItem(obj, id || '', options).then(setItemPermissions(options));
  };

  /**
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger | Function} [changeLogger]
   * @param {{user: User}} options
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, options) {
    return aclProvider.checkAccess(options.user.id(), classPrefix + classname, [Permissions.USE])
      .then(function (accessible) {
        if (accessible) {
          return dataRepo.createItem(classname, data, version, changeLogger, options);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  function checkWritePermission(classname, id, options) {
    return aclProvider.getPermissions(options.user.id(), [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        let accessible = permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.WRITE] ||
          permissions[itemPrefix + classname + '@' + id] &&
          permissions[itemPrefix + classname + '@' + id][Permissions.WRITE];
        if (accessible || !workflow) {
          return accessible;
        }
        return _this._getItem(classname, id, options)
          .then((item)=>{
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
  this._editItem = function (classname, id, data, changeLogger, options) {
    return checkWritePermission(classname, id, options)
      .then((writable) => {
        if (writable) {
          return dataRepo.editItem(classname, id, data, changeLogger, options);
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
  this._saveItem = function (classname, id, data, version, changeLogger, options) {
    return checkWritePermission(classname, id, options)
      .then(function (writable) {
        if (writable) {
          return dataRepo.saveItem(classname, id, data, version, changeLogger, options);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      });
  };

  function checkDeletePermission(classname, id, options) {
    return aclProvider.getPermissions(options.user.id(), [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        let accessible = permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.DELETE] ||
          permissions[itemPrefix + classname + '@' + id] &&
          permissions[itemPrefix + classname + '@' + id][Permissions.DELETE];
        if (accessible || !workflow) {
          return accessible;
        }
        return _this._getItem(classname, id, options)
          .then((item)=>{
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
    return setItemPermissions(options)(master)
      .then((m) => {
        if (!m.permissions[Permissions.WRITE]) {
          return false;
        }
        let p;
        let breaker = '_____UNUSABLE____';
        details.forEach(function (d) {
          p = p ? p.then(()=>setItemPermissions(options)(d)) : setItemPermissions(options)(d);
          p = p.then((di) => {
            if (!di.permissions[Permissions.USE]) {
              return Promise.reject(breaker);
            }
            return Promise.resolve();
          });
        });
        return p.catch((e) => {
          return e === breaker ? Promise.resolve(false) : Promise.reject(e);
        }).then(()=>true);
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
    let p = master.property(collection);
    let collectionPermissions = {};
    return setItemPermissions(options)(master)
      .then(function (m) {
        if (m.permissions[Permissions.READ]) {
          return exclude(options.user.id(), p.meta._refClass.getCanonicalName(), options.filter, collectionPermissions);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      }).then(function (filter) {
        options.filter = filter;
        return dataRepo.getAssociationsList(master, collection, options);
      }).then(function (list) {
        list.permissions = collectionPermissions;
        return Promise.resolve(list);
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
    var p = master.property(collection);
    return setItemPermissions(options)(master)
      .then(function (m) {
        if (m.permissions[Permissions.READ]) {
          return exclude(options.user.id(), p.meta._refClass.getCanonicalName(), options.filter);
        }
        throw new IonError(Errors.PERMISSION_LACK);
      }).then(function (filter) {
        options.filter = filter;
        return dataRepo.getAssociationsCount(master, collection, options);
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
