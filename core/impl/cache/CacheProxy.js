/**
 * Created by inkz on 10/6/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');

/**
 *
 * @param {Object} config
 * @constructor
 */
function CacheProxy(config) {

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return new Promise(function (resolve, reject) {
      resolve(null);
    });
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
   * @private
   */
  this._set = function (key, value) {
    return new Promise(function (resolve, reject) {
      resolve();
    });
  };
}

CacheProxy.prototype = new CacheRepository();
module.exports = CacheProxy;
