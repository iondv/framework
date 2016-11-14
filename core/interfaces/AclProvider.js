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
   *
   * @param {String | Array} roles
   * @returns {Promise}
   */
  this.getResources = function (roles) {
    return this._getResources(roles);
  };
}

module.exports = AclProvider;
