/**
 * Created by kras on 02.03.16.
 */
'use strict';

/**
 * @constructor
 */
function DataSource() {
  /**
   * @returns {*}
   */
  this.connection = function () {
    return this._connection();
  };

  /**
   * @returns {Promise}
   */
  this.open = function () {
    return this._open();
  };

  /**
   * @returns {Promise}
   */
  this.close = function () {
    return this._close();
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @returns {Promise}
   */
  this.delete = function (type, conditions) {
    return this._delete(type, conditions);
  };

  /**
   * @param {String} type
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.insert = function (type, data, options) {
    return this._insert(type, data, options);
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.update = function (type, conditions, data, options) {
    return this._update(type, conditions, data, options || {});
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.updateMany = function (type, conditions, data, options) {
    return this._updateMany(type, conditions, data, options || {});
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.upsert = function (type, conditions, data, options) {
    return this._upsert(type, conditions, data, options || {});
  };

  /**
   * @param {String} type
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.sort]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.countTotal]
   * @param {String} [options.to]
   * @param {String} [options.append]
   * @returns {Promise}
   */
  this.fetch = function (type, options) {
    return this._fetch(type, options);
  };

  /**
   * @param {String} type
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @returns {Promise}
   */
  this.count = function (type, options) {
    return this._count(type, options);
  };

  /**
   * @param {String} type
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.sort]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.countTotal]
   * @returns {Promise}
   */
  this.iterator = function (type, options) {
    return this._iterator(type, options);
  };

  /**
   * @param {String} type
   * @param {{}} options
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.aggregates]
   * @param {String} [options.to]
   * @param {String} [options.append]
   * @returns {Promise}
   */
  this.aggregate = function (type, options) {
    return this._aggregate(type, options);
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @returns {Promise}
   */
  this.get = function (type, conditions) {
    return this._get(type, conditions);
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @param {{unique: Boolean}} [options]
   * @returns {Promise}
   */
  this.ensureIndex = function (type, properties, options) {
    return this._ensureIndex(type, properties, options);
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @returns {Promise}
   */
  this.ensureAutoincrement = function (type, properties) {
    return this._ensureAutoincrement(type, properties);
  };
}

module.exports = DataSource;
