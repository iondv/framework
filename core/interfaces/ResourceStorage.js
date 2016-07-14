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
   * @param {String} id
   * @returns {Promise}
   */
  this.data = function (id) {
    return this._data(id);
  };

  /**
   * @param {String} uid
   * @param {String} id
   * @returns {Promise}
   */
  this.resourceURL = function (uid, id) {
    return this._resourceURL(uid, id);
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
