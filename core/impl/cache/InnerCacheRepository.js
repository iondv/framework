/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/8/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');

/**
 *
 * @param {Object} config
 * @constructor
 */
function InnerCacheRepository(config) {

  var cache = {};

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
     */
  this._get = function (key) {
    return new Promise(function (resolve, reject) {
      resolve(cache[key]);
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
      cache[key] = value;
      resolve();
    });
  };

}

InnerCacheRepository.prototype = new CacheRepository();
module.exports = InnerCacheRepository;
