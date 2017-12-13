/**
 * Created by krasilneg on 23.01.17.
 */
'use strict';

const Acl = require('acl');
const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const Permissions = require('core/Permissions');
const chain = require('core/util/chain');
const _ = require('lodash');
const F = require('core/FunctionCodes');

/**
 * @param {{}} config
 * @param {DataSource} config.dataSource
 * @constructor
 */
function MongoAclAccessManager(config) {
  var _this = this;

  var ds = config.dataSource;

  if (!ds || ds.constructor.prototype.constructor.name !== 'DataSource') {
    throw 'Не указан источник данных для подсистемы контроля доступа!';
  }

  this.acl = null;

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
    subjects  = Array.isArray(subjects) ? subjects : [subjects];
    let roleChunks = _.chunk(roles, 10);
    return chain(roles, (role) => _this._defineRole(role))
      .then(() =>
        chain(subjects, (subject) => {
          return chain(roleChunks, (rc) => new Promise((resolve, reject) => {
            _this.acl.addUserRoles(subject, rc, (err) => err ? reject(err) : resolve());
          }));
        })
      );
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions) {
    let roleChunks = _.chunk(roles, 10);
    let resChunks = _.chunk(resources, 10);
    return chain(roles, (role) => _this._defineRole(role))
      .then(() => chain(resources, (resource) => _this._defineResource(resource)))
      .then(() => {
        return chain(roleChunks, (rolesc) => {
          return chain(resChunks, (resc) => new Promise((resolve, reject) => {
            _this.acl.allow(rolesc, resc, permissions, (err) => err ? reject(err) : resolve());
          }));
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
    let resChunks = _.chunk(resources, 10);
    return chain(roles, function (role) {
      return chain(resChunks, (resc) => new Promise((resolve, reject) => {
        _this.acl.removeAllow(role, resc, permissions, (err) => err ? reject(err) : resolve());
      }));
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._unassignRoles = function (subjects, roles) {
    let roleChunks = _.chunk(roles, 10);
    return chain(subjects, function (subject) {
      return chain(roleChunks, (rolesc) => new Promise((resolve, reject) => {
        _this.acl.removeUserRoles(subject, rolesc, (err) => err ? reject(err) : resolve());
      }));
    });
  };
  /**
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._undefineRoles = function (roles) {
    return chain(roles, (role) => {
      return ds.delete('ion_security_role', {[F.EQUAL]: ['$id', role]})
        .then(
          () => new Promise((resolve, reject) => {
            _this.acl.removeRole(role, (err) => err ? reject(err) : resolve());
          })
        );
    });
  };

  this._defineRole = function (role, caption = null) {
    let data = {id: role};
    if (caption) {
      data.name = caption;
    }
    return ds.upsert('ion_security_role', {[F.EQUAL]: ['$id', role]}, data);
  };

  this._defineResource = function (resource, caption = null) {
    let data = {id: resource};
    if (caption) {
      data.name = caption;
    }
    return ds.upsert('ion_security_resource', {[F.EQUAL]: ['$id', resource]}, data);
  };

  /**
   * @param {String[]} resources
   * @returns {Promise}
   */
  this._undefineResources = function (resources) {
    return chain(resources, (resource) => {
      return ds.delete('ion_security_resource', {[F.EQUAL]: ['$id', resource]})
        .then(
          () => new Promise((resolve, reject) => {
            _this.acl.removeResource(resource, (err) => err ? reject(err) : resolve());
          })
        );
    });
  };
}

MongoAclAccessManager.prototype = new RoleAccessManager();
module.exports = MongoAclAccessManager;
