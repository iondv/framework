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
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this.checkAccess = function (subject, resource, permissions) {
    return this._checkAccess(subject, resource, permissions);
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this.getPermissions = function (subject, resources, skipGlobals) {
    return this._getPermissions(subject, resources, skipGlobals);
  };
}

module.exports = AclProvider;
