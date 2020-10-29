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
const {t} = require('core/i18n');

/**
 * @param {{}} config
 * @param {DataSource} config.dataSource
 * @constructor
 */
function MongoAclAccessManager(config) {
  var _this = this;

  var ds = config.dataSource;

  if (!ds || ds.constructor.prototype.constructor.name !== 'DataSource') {
    throw new Error(t('Data source not specified for ACL subsytem!'));
  }

  this.acl = null;

  var globalMarker = config.allAlias ? config.allAlias : '*';

  this._globalMarker = function () {
    return globalMarker;
  };

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    _this.acl = new Acl(new Acl.mongodbBackend(ds.connection(), config.prefix ? config.prefix : 'ion_acl_'));
    return Promise.resolve();
  };

  function fetchAllRoles() {
    return ds.fetch('ion_security_role', {});
  }

  function fetchAllResources() {
    return ds.fetch('ion_security_resource', {});
  }

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getRoles = function (subject) {
    return new Promise(function (resolve, reject) {
      if (!subject) {
        return fetchAllRoles().then(resolve).catch(reject);
      }
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
      if (!roles) {
        return fetchAllResources().then(resolve).catch(reject);
      }
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
    roles = Array.isArray(roles) ? roles : [roles];
    let roleChunks = _.chunk(roles, 10);
    return chain(roles, role => _this._defineRole(role))
      .then(() =>
        chain(subjects, subject =>
          chain(roleChunks, rc => new Promise((resolve, reject) => {
            _this.acl.addUserRoles(subject, rc, err => err ? reject(err) : resolve());
          })))
      );
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions) {
    roles = Array.isArray(roles) ? roles : [roles];
    resources = Array.isArray(resources) ? resources : [resources];
    let roleChunks = _.chunk(roles, 10);
    let resChunks = _.chunk(resources, 10);
    return chain(roles, role => _this._defineRole(role))
      .then(() => chain(resources, resource => _this._defineResource(resource)))
      .then(() =>
        chain(roleChunks, rolesc =>
          chain(resChunks, resc => new Promise((resolve, reject) => {
            _this.acl.allow(rolesc, resc, permissions, err => err ? reject(err) : resolve());
          }))
        )
      );
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._deny = function (roles, resources, permissions) {
    resources = Array.isArray(resources) ? resources : [resources];
    let resChunks = _.chunk(resources, 10);
    return chain(roles, function (role) {
      return chain(resChunks, resc => new Promise((resolve, reject) => {
        _this.acl.removeAllow(role, resc, permissions, err => err ? reject(err) : resolve());
      }));
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._unassignRoles = function (subjects, roles) {
    roles = Array.isArray(roles) ? roles : [roles];
    let roleChunks = _.chunk(roles, 10);
    return chain(subjects, subject =>
      chain(roleChunks, rolesc => new Promise((resolve, reject) => {
        _this.acl.removeUserRoles(subject, rolesc, err => err ? reject(err) : resolve());
      }))
    );
  };
  /**
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._undefineRoles = function (roles) {
    return chain(roles, role =>
      ds.delete('ion_security_role', {[F.EQUAL]: ['$id', role]})
        .then(
          () => new Promise((resolve, reject) => {
            _this.acl.removeRole(role, err => err ? reject(err) : resolve());
          })
        )
    );
  };

  this._defineRole = function (role, caption = null, description = null) {
    let data = {id: role};
    if (caption) {
      data.name = caption;
    }
    if (description) {
      data.description = description;
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
    return chain(resources, resource =>
      ds.delete('ion_security_resource', {[F.EQUAL]: ['$id', resource]})
        .then(
          () => new Promise((resolve, reject) => {
            _this.acl.removeResource(resource, err => err ? reject(err) : resolve());
          })
        )
    );
  };
}

MongoAclAccessManager.prototype = new RoleAccessManager();
module.exports = MongoAclAccessManager;
