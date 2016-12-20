/**
 * Created by kras on 02.03.16.
 */
'use strict';

/**
 * @constructor
 */
function AclProvider() {

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return this._init();
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this.checkAccess = function (subject, resource, permissions) {
    return this._checkAccess(subject, resource, permissions);
  };

  /**
   *
   * @param {String} subject
   * @returns {*}
   */
  this.getRoles = function (subject) {
    return this._getRoles(subject);
  };

  /**
   * @param {String | Array} roles
   * @returns {Promise}
   */
  this.getResources = function (roles) {
    return this._getResources(roles);
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this.assignRoles = function (subjects, roles) {
    return this._assignRoles(subjects, roles);
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this.getPermissions = function (subject, resources) {
    return this._getPermissions(subject, resources);
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this.grant = function (roles, resources, permissions) {
    return this._grant(roles, resources, permissions);
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this.deny = function (roles, resources, permissions) {
    return this._deny(roles, resources, permissions);
  };
}

module.exports = AclProvider;
