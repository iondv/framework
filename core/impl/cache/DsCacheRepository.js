/**
 * Created by krasilneg on 07.11.18.
 */
'use strict';

const Repository = require('core/interfaces/Repository');
const F = require('core/FunctionCodes');

/**
 *
 * @param {{dataSource: DataSource, name: String}} config
 * @constructor
 */
function DsCacheRepository(config) {

  const tableName = 'ion_cache_' + config.name;


  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return config.dataSource.get(tableName, {[F.EQUAL]: ['$name', key]}).then(rec => rec ? rec.value : null);
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
   * @private
   */
  this._set = function (key, value) {
    return config.dataSource.upsert(tableName, {[F.EQUAL]: ['$name', key]}, {name: key, value: value});
  };

  this.init = function () {
    return config.dataSource.ensureIndex(tableName, {name: 1}, {unique: true});
  };
}

DsCacheRepository.prototype = new Repository();
module.exports = DsCacheRepository;
