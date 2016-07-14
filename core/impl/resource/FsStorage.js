/**
 * Created by kras on 14.07.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage');

function FsStorage(options) {
  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    return new Promise(function (resolve) {resolve();});
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._data = function (id) {
    return new Promise(function (resolve) {resolve();});
  };

  /**
   * @param {String} uid
   * @param {String} id
   * @returns {Promise}
   */
  this._resourceURL = function (uid, id) {
    return new Promise(function (resolve) {resolve();});
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return function (req, res, next) {
      next();
    };
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve) {resolve();});
  };
}

FsStorage.prototype = new ResourceStorage();

module.exports = FsStorage;
