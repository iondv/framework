/**
 * Created by krasilneg on 23.01.17.
 */
'use strict';

function RoleAccessManager() {

  /**
   * @returns {Promise}
   */
  this.init = function () {
    if (typeof this._init === 'function') {
      return this._init();
    }
    return Promise.resolve();
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
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this.unassignRoles = function (subjects, roles) {
    return this._unassignRoles(subjects, roles);
  };

  this.defineRole = function (role, caption = null) {
    return this._defineRole(role, caption);
  };

  this.defineResource = function (resource, caption = null) {
    return this._defineResource(resource, caption);
  };

  /**
   * @param {String[]} roles
   * @returns {Promise}
   */
  this.undefineRoles = function (roles) {
    return this._undefineRoles(roles);
  };

  /**
   * @param {String[]} resources
   * @returns {Promise}
   */
  this.undefineResources = function (resources) {
    return this._undefineResources(resources);
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

module.exports = RoleAccessManager;
