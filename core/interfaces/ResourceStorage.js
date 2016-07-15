/**
 * Created by kras on 14.07.16.
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
   * @param {String[]} ids
   * @returns {Promise}
   */
  this.data = function (ids) {
    return this._data(ids);
  };

  /**
   * @param {String} uid
   * @param {String[]} ids
   * @returns {Promise}
   */
  this.resourceLinks = function (uid, ids) {
    return this._resourceLinks(uid, ids);
  };

  /**
   * @returns {Function}
   */
  this.middle = function () {
    if (typeof this.middle === 'function') {
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

module.exports = ResourceStorage;
