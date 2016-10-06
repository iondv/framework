/**
 * Created by inkz on 10/6/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');

/**
 * 
 * @param config
 * @constructor
 */
function CacheProxy(config) {

  /**
   * 
   * @param key
   * @returns {Promise}
   * @private
   */
  this._get = function(key) {
    return new Promise(function(resolve, reject){
      resolve(null);
    });
  };

  /**
   * 
   * @param key
   * @param value
   * @returns {Promise}
   * @private
   */
  this._set = function(key, value) {
    console.log("CACHE:",key,":",value);
    return new Promise(function(resolve, reject){
      resolve();
    });
  }
}

CacheProxy.prototype = new CacheRepository();
module.exports = CacheProxy;
