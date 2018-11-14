/**
 * Created by inkz on 10/6/16.
 */
'use strict';

const Repository = require('core/interfaces/Repository');

/**
 * @constructor
 */
function CacheProxy() {

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return Promise.resolve(null);
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
   * @private
   */
  this._set = function (key, value) {
    return Promise.resolve();
  };
}

CacheProxy.prototype = new Repository();
module.exports = CacheProxy;
