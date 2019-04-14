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
   * @param {{}} options
   * @returns {Promise}
   */
  this.fetch = function (ids, options) {
    return this._fetch(ids, options);
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    if (typeof this._init === 'function') {
      return this._init();
    }
    return Promise.resolve();
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
   * @param {Boolean} fetch
   * @returns {Promise}
   */
  this.createDir = function (name, parentDirId, fetch) {
    return this._createDir(name, parentDirId, fetch);
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
   * @param {String} [access]
   * @param {{}} [options]
   * @returns {Promise<Share>}
   */
  this.share = function (id, access, options) {
    return this._share(id, access, options);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise<Share>}
   */
  this.currentShare = function (id) {
    return this._currentShare(id);
  };

  /**
   *
   * @param {String} share
   * @returns {Promise}
   */
  this.deleteShare = function (share) {
    return this._deleteShare(share);
  };

  /**
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this.setShareAccess  = function (id, access) {
    return this._setShareAccess(id, access);
  };

  /**
   * @param {String} id
   * @param {{}} options
   * @returns {Promise<Share>}
   */
  this.setShareOptions = function (id, options) {
    return this._setShareOptions(id, options);
  };

  this.fileRoute = function () {
    if (typeof this._fileRoute === 'function') {
      return this._fileRoute();
    }
    return false;
  };

  this.shareRoute = function () {
    if (typeof this._shareRoute === 'function') {
      return this._shareRoute();
    }
    return false;
  };
}

module.exports.ResourceStorage = ResourceStorage;
module.exports.StoredFile = require('./lib/StoredFile');
module.exports.Share = require('./lib/Share');
