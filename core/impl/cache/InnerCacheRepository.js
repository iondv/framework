/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/8/16.
 */
'use strict';

const Repository = require('core/interfaces/Repository');

/**
 *
 * @param {Object} config
 * @constructor
 */
function InnerCacheRepository() {

  const cache = {};

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
     */
  this._get = function (key) {
    return Promise.resolve(cache[key]);
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
     * @private
     */
  this._set = function (key, value) {
    cache[key] = value;
    return Promise.resolve();
  };

}

InnerCacheRepository.prototype = new Repository();
module.exports = InnerCacheRepository;
