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
 * @param {AclProvider} options.acl
 * @param {MetaRepository} options.meta
 * @constructor
 */
function SecuredDataRepository(options) {

  /**
   * @type {DataRepository}
   */
  var dataRepo = options.data;

  /**
   * @type {AclProvider}
   */
  var aclProvider = options.acl || new AclMock();

  /**
   * @type {MetaRepository}
   */
  var metaRepo = options.meta;

  var classPrefix = options.classPrefix || 'c:::';
  var itemPrefix = options.itemPrefix || 'i:::';
  var attrPrefix = options.attrPrefix || 'a:::';

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
      classResources(resources, descendants[i]);
    }
  }

  /**
   * @param {String} uid
   * @param {String} cn
   * @param {{} | null} filter
   * @private
   */
  function exclude(uid, cn, filter, classPermissions) {
    var cm = metaRepo.getMeta(cn);
    var check = [];
    var resources = [];
    classResources(check, resources, cm);
    return aclProvider.getPermissions(uid, resources).then(function (permissions) {
      return new Promise(function (resolve) {
        var exc = [];
        for (var i = 0; i < check.length; i++) {
          if (!permissions[resources[i]] || !permissions[resources[i]][Permissions.READ]) {
            exc.push(check[i]);
          }
        }

        if (exc.length) {
          if (!filter) {
            filter = {_class: {$not: {$in: exc}}};
          } else {
            filter = {$and: [{_class: {$not: {$in: exc}}}, filter]};
          }
        }

        merge(classPermissions || {}, permissions[classPrefix + cm.getCanonicalName()] || {});
        resolve(filter);
      });
    });
  }

  function rejectByClass(className) {
    return Promise.reject(new Error('Нет прав на использование класса ' + className));
  }

  function rejectByItem(className, id) {
    return Promise.reject(new Error('Недостаточно прав на объект ' + className + '@' + id));
  }

  /**
   * @param {String} className
   * @param {Object} data
   * @param {String} [version]
   * @param {{autoassign: Boolean}} [options]
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
      throw new Error('Не передана информация о классе.');
    }
    return cn;
  }

  /**
   *
   * @param {String | Item} obj
   * @param {{filter: Object, uid: String}} options
   * @returns {Promise}
   */
  this._getCount  = function (obj, options) {
    var cname = cn(obj);
    return exclude(options.uid, cname, options.filter).then(
      function (filter) {
        options.filter = filter;
        return dataRepo.getCount(obj, options);
      }
    );
  };

  /**
   * @param {String | Item} obj
   * @param {{uid: String}} [options]
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
    return exclude(options.uid, cname, options.filter, listPermissions)
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
    return exclude(options.uid, className, options.filter).then(
      function (filter) {
        options.filter = filter;
        return dataRepo.aggregate(className, options);
      }
    );
  };

  /**
   *
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{uid: String}} options
   * @param {Number} [options.nestingDepth]
   */
  this._getItem = function (obj, id, options) {
    var cname = cn(obj);
    var itemPermissions = {};
    return aclProvider.getPermissions(options.uid, [classPrefix + cname, itemPrefix + cname + '@' + id])
      .then(function (permissions) {
        if (
          permissions[classPrefix + cname] &&
          permissions[classPrefix + cname][Permissions.READ] ||
          permissions[itemPrefix + cname + '@' + id] &&
          permissions[itemPrefix + cname + '@' + id][Permissions.READ]) {
          itemPermissions = merge(
            permissions[itemPrefix + cname + '@' + id] || {},
            permissions[classPrefix + cname] || {}
          );
          return dataRepo.getItem(obj, id, options);
        }
        return rejectByItem(cname, id);
      }).then(function (item) {
        item.permissions = itemPermissions;
        return Promise.resolve(item);
      });
  };

  /**
   *
   * @param {String} classname
   * @param {Object} data
   * @param {String} [version]
   * @param {ChangeLogger | Function} [changeLogger]
   * @param {{uid: String}} options
   * @returns {Promise}
   */
  this._createItem = function (classname, data, version, changeLogger, options) {
    return aclProvider.checkAccess(options.uid, classPrefix + classname, [Permissions.USE])
      .then(function (accessible) {
        if (accessible) {
          return dataRepo.createItem(classname, data, version, changeLogger, options);
        }
        return rejectByClass(classname);
      });
  };

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
    return aclProvider.getPermissions(options.uid, [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        if (
          permissions[classPrefix + classname] &&
          permissions[classPrefix + classname][Permissions.WRITE] ||
          permissions[itemPrefix + classname + '@' + id] &&
          permissions[itemPrefix + classname + '@' + id][Permissions.WRITE]
        ) {
          return dataRepo.editItem(classname, id, data, changeLogger, options);
        }
        return rejectByItem(classname, id);
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
    return aclProvider.getPermissions(options.uid, [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        if (
          permissions[classPrefix + classname] && permissions[classPrefix + classname][Permissions.WRITE] ||
            permissions[itemPrefix + classname + '@' + id] &&
            permissions[itemPrefix + classname + '@' + id][Permissions.WRITE]
        ) {
          return dataRepo.saveItem(classname, id, data, version, changeLogger, options);
        }
        return rejectByItem(classname, id);
      });
  };

  /**
   *
   * @param {String} classname
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{uid: String}} options
   */
  this._deleteItem = function (classname, id, changeLogger, options) {
    return aclProvider.getPermissions(options.uid, [classPrefix + classname, itemPrefix + classname + '@' + id])
      .then(function (permissions) {
        if (
          permissions[classPrefix + classname] && permissions[classPrefix + classname][Permissions.DELETE] ||
            permissions[itemPrefix + classname + '@' + id] &&
            permissions[itemPrefix + classname + '@' + id][Permissions.DELETE]
        ) {
          return dataRepo.deleteItem(classname, id, changeLogger);
        }
        return rejectByItem(classname, id);
      });
  };

  function collectionResources(master, collection, details) {
    var resources = [
      classPrefix + master.getClassName(),
      itemPrefix + master.getClassName() + '@' + master.getItemId(),
      attrPrefix + master.getClassName() + '.' + collection
    ];

    for (var i = 0; i < details.length; i++) {
      resources.push(classPrefix + details[i].getClassName());
      resources.push(itemPrefix + details[i].getClassName() + '@' + details[i].getItemId());
    }
    return resources;
  }

  function checkCollectionWriteAccess(master, collection, details, permissions) {
    if (
      !(
        permissions[classPrefix + master.getClassName()] &&
        permissions[classPrefix + master.getClassName()][Permissions.WRITE]) &&
      !(permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()] &&
        permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()][Permissions.WRITE])
    ) {
      return false;
    }
    /* Контроль доступа к атрибутам пока не используем
        if (permissions[itemPrefix + master.getClassName() + '.' + collection][Permissions.WRITE]) {
          return true;
        }
    */
    for (var i = 0; i < details.length; i++) {
      if (
        !(permissions[classPrefix + details[i].getClassName()] &&
          permissions[classPrefix + details[i].getClassName()][Permissions.READ]) &&
        !(permissions[itemPrefix + details[i].getClassName() + '@' + details[i].getItemId()] &&
          permissions[itemPrefix + details[i].getClassName() + '@' + details[i].getItemId()][Permissions.READ])
      ) {
        return false;
      }
    }
    return true;
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
    return aclProvider.getPermissions(options.uid, collectionResources(master, collection, details))
      .then(function (permissions) {
        if (checkCollectionWriteAccess(master, collection, details, permissions)) {
          return dataRepo.put(master, collection, details, changeLogger);
        }
        return Promise.reject(
          new Error('Недостаточно прав для записи в коллекцию ' + master.getClassName() + '.' + collection)
        );
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
    return aclProvider.getPermissions(options.uid, collectionResources(master, collection, details))
      .then(function (permissions) {
        if (checkCollectionWriteAccess(master, collection, details, permissions)) {
          return dataRepo.eject(master, collection, details, changeLogger);
        }
        return Promise.reject(
          new Error('Недостаточно прав для записи в коллекцию ' + master.getClassName() + '.' + collection)
        );
      });
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{uid: String}} options
   * @param {Object} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Object} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this._getAssociationsList = function (master, collection, options) {
    var p = master.property(collection);
    var collectionPermissions = {};
    return aclProvider.getPermissions(
      options.uid,
      [
        classPrefix + master.getClassName(),
        itemPrefix + master.getClassName() + '@' + master.getItemId(),
        classPrefix + p.meta._refClass.getCanonicalName()
      ])
      .then(function (permissions) {
        if (
          permissions[classPrefix + master.getClassName()] &&
          permissions[classPrefix + master.getClassName()][Permissions.READ] ||
          permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()] &&
          permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()][Permissions.READ]
        ) {
          return exclude(options.uid, p.meta._refClass.getCanonicalName(), options.filter, collectionPermissions);
        }
        return Promise.reject(
          new Error('Недостаточно прав для чтения коллекции ' + master.getClassName() + '.' + collection)
        );
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
   * @param {{uid: String}} options
   * @param {{}} [options.filter]
   * @returns {Promise}
   */
  this._getAssociationsCount = function (master, collection, options) {
    var p = master.property(collection);
    return aclProvider.getPermissions(
      options.uid,
      [
        classPrefix + master.getClassName(),
        itemPrefix + master.getClassName() + '@' + master.getItemId(),
        classPrefix + p.meta._refClass.getCanonicalName()
      ])
      .then(function (permissions) {
        if (
          permissions[classPrefix + master.getClassName()] &&
          permissions[classPrefix + master.getClassName()][Permissions.READ] ||
          permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()] &&
          permissions[itemPrefix + master.getClassName() + '@' + master.getItemId()][Permissions.READ]
        ) {
          return exclude(options.uid, p.meta._refClass.getCanonicalName(), options.filter);
        }
        Promise.reject(
          new Error('Недостаточно прав для чтения коллекции ' + master.getClassName() + '.' + collection)
        );
      }).then(function (filter) {
        options.filter = filter;
        return dataRepo.getAssociationsCount(master, collection, options);
      });
  };
}

SecuredDataRepository.prototype = new DataRepository();
module.exports = SecuredDataRepository;
