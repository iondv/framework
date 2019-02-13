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
    if (typeof this._init === 'function') {
      return this._init();
    }
    return Promise.resolve();
  };

  /**
   * @param {String | User} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this.checkAccess = function (subject, resource, permissions) {
    return this._checkAccess(subject, resource, permissions);
  };

  /**
   * @param {String | String[] | User} subject
   * @param {String | String[]} resources
   * @param {Boolean} [skipGlobals]
   * @returns {Promise}
   */
  this.getPermissions = function (subject, resources, skipGlobals) {
    return this._getPermissions(subject, resources, skipGlobals);
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this.getResources = function (subject, permissions) {
    return this._getResources(subject, permissions);
  };

  /**
   * @param {String} subject
   */
  this.getCoactors = function (subject) {
    return this._getCoactors(subject);
  };
}

module.exports = AclProvider;
