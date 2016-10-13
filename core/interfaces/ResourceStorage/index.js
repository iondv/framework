/**
 * Created by kras on 26.07.16.
 */
'use strict';

function ResourceStorage() {
  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} directory
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.accept = function (data, directory, options) {
    return this._accept(data, directory, options);
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

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this.getDir = function (id) {
    return this._getDir(id);
  };

  /**
   *
   * @param {String} name
   * @param {String} parentDirId
   * @returns {Promise}
   */
  this.createDir = function (name, parentDirId) {
    return this._createDir(name, parentDirId);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this.removeDir = function (id) {
    return this._removeDir(id);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this.putFile = function (dirId, fileId) {
    return this._putFile(dirId, fileId);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this.ejectFile = function (dirId, fileId) {
    return this._ejectFile(dirId, fileId);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this.share = function (id) {
    return this._share(id);
  };
}

module.exports.ResourceStorage = ResourceStorage;
module.exports.StoredFile = require('./lib/StoredFile');
