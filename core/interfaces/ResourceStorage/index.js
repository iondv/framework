/**
 * Created by kras on 26.07.16.
 */
'use strict';

function ResourceStorage() {
  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.accept = function (data, options) {
    return this._accept(data, options);
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this.remove = function (id) {
    return this._remove(id);
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this.fetch = function (ids) {
    return this._fetch(ids);
  };

  /**
   * @returns {Function}
   */
  this.middle = function () {
    if (typeof this._middle === 'function') {
      return this._middle();
    }
    return function (req, res, next) { next(); };
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    if (typeof this._init === 'function') {
      return this._init();
    }
    return new Promise(function (resolve) {resolve();});
  };
}

module.exports.ResourceStorage = ResourceStorage;
module.exports.StoredFile = require('./lib/StoredFile');
