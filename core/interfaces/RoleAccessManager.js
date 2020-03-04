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

  this.globalMarker = function () {
    return this._globalMarker();
  }

  /**
   *
   * @param {String} subject
   * @returns {Promise}
   */
  this.getRoles = function (subject) {
    return this._getRoles(subject);
  };

  /**
   * @param {String | Array} roles
   * @param {String[]} [permissions]
   * @param {String} [prefix]
   * @returns {Promise}
   */
  this.getResources = function (roles, permissions, prefix) {
    return this._getResources(roles, permissions, prefix);
  };

  /**
   * @param {String | String[]} roles
   * @returns {Promise}
   */
  this.getSubjects = function (roles) {
    return this._getSubjects(roles);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this.getRole = function (id) {
    return this._getRole(id);
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this.getResource = function (id) {
    return this._getResource(id);
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @param {User} [author]
   * @returns {Promise}
   */
  this.assignRoles = function (subjects, roles, author) {
    return this._assignRoles(subjects, roles, author);
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @param {User} [author]
   * @returns {Promise}
   */
  this.unassignRoles = function (subjects, roles, author) {
    return this._unassignRoles(subjects, roles, author);
  };

  this.defineRole = function (role, caption = null, description = null, author = null) {
    return this._defineRole(role, caption, description, author);
  };

  this.defineResource = function (resource, caption = null) {
    return this._defineResource(resource, caption);
  };

  /**
   * @param {String[]} roles
   * @param {User} [author]
   * @returns {Promise}
   */
  this.undefineRoles = function (roles, author) {
    return this._undefineRoles(roles, author);
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
   * @param {String[]} [permissions]
   * @param {User} [author]
   * @returns {Promise}
   */
  this.grant = function (roles, resources, permissions, author) {
    return this._grant(roles, resources, permissions, author);
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} [permissions]
   * @param {User} [author]
   * @returns {Promise}
   */
  this.deny = function (roles, resources, permissions, author) {
    return this._deny(roles, resources, permissions, author);
  };
}

module.exports = RoleAccessManager;
