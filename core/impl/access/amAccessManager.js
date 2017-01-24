/**
 * Created by krasilneg on 23.01.17.
 */
'use strict';

const Acl = require('acl');
const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const Permissions = require('core/Permissions');
const chain = require('core/util/chain');

function MongoAclAccessManager(config) {
  var _this = this;

  var ds = config.dataSource;

  if (!ds || ds.constructor.prototype.constructor.name !== 'DataSource') {
    throw 'Не указан источник данных для подсистемы контроля доступа!';
  }

  this.acl = {};

  this.globalMarker = config.allAlias ? config.allAlias : '*';

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      _this.acl = new Acl(new Acl.mongodbBackend(ds.connection(), config.prefix ? config.prefix : 'ion_acl_'));
      resolve();
    });
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getRoles = function (subject) {
    return new Promise(function (resolve, reject) {
      _this.acl.userRoles(subject, function (err, roles) {
        return err ? reject(err) : resolve(roles);
      });
    });
  };

  /**
   * @param {String | String[]} roles
   * @param {String | String[]} [permissions]
   * @returns {Promise}
   */
  this._getResources = function (roles, permissions) {
    return new Promise(function (resolve, reject) {
      var p = null;
      if (permissions) {
        p = Array.isArray(permissions) ? permissions.slice(0) : [permissions];
        if (p.indexOf(Permissions.FULL) < 0) {
          p.push(Permissions.FULL);
        }
      }
      if (p) {
        return _this.acl.whatResources(roles, p, function (err, res) {
          return err ? reject(err) : resolve(res);
        });
      }
      return _this.acl.whatResources(roles, function (err, res) {
        return err ? reject(err) : resolve(res);
      });
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._assignRoles = function (subjects, roles) {
    var promises = [];
    subjects.forEach(function (subject) {
      promises.push(new Promise(function (resolve, reject) {
        _this.acl.addUserRoles(subject, roles, function (err) {
          return err ? reject(err) : resolve();
        });
      }));
    });
    return Promise.all(promises);
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions) {
    return new Promise(function (resolve, reject) {
      _this.acl.allow(roles, resources, permissions, function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._deny = function (roles, resources, permissions) {
    return new Promise(function (resolve, reject) {
      _this.acl.removeAllow(roles, resources, permissions, function (err) {
        return err ? reject(err) : resolve();
      });
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._unassignRoles = function (subjects, roles) {
    return chain(subjects, function (subject) {
      return new Promise(function (resolve, reject) {
        _this.acl.removeUserRoles(subject, roles, function (err) {
          return err ? reject(err) : resolve();
        });
      });
    });
  };
  /**
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._undefineRoles = function (roles) {
    return chain(roles, function (role) {
      return new Promise(function (resolve, reject) {
        _this.acl.removeRole(role, function (err) {
          return err ? reject(err) : resolve();
        });
      });
    });
  };

  /**
   * @param {String[]} resources
   * @returns {Promise}
   */
  this._undefineResources = function (resources) {
    return chain(resources, function (resource) {
      return new Promise(function (resolve, reject) {
        _this.acl.removeResource(resource, function (err) {
          return err ? reject(err) : resolve();
        });
      });
    });
  };
}

MongoAclAccessManager.prototype = new RoleAccessManager();
module.exports = MongoAclAccessManager;
