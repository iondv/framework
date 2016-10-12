/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/11/16.
 */
'use strict';

var request = require('request');
var fs = require('fs');
var cuid = require('cuid');
var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  var _this = this;
  var urlTypes = {
    WEBDAV: 'remote.php/webdav/',
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares?format=json'
  };

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} directory
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, directory, options) {
    return new Promise(function (resolve,reject) {

      var d,fn,reader;
      var id = cuid();

      if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
        fn = options.name || data.originalname || data.name || id;
        if (typeof data.buffer !== 'undefined') {
          d = data.buffer;
        } else if (typeof data.path !== 'undefined') {
          d = data.path;
        }
      } else if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
        d = data;
        fn = options.name || id;
      }

      if (!d) {
        throw new Error('Переданы данные недопустимого типа!');
      }

      if (typeof d.pipe === 'function') {
        reader = d;
      } else {
        reader = fs.createReadStream(d);
      }

      var reqParams = {
        uri: config.url + urlTypes.WEBDAV + (directory ? directory : '') + fn,
        auth: {
          user: config.login,
          password: config.password
        }
      };

      reader.pipe(request.put(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            
        } else {
          reject(err);
        }
      }));

    });
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {

  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve,reject) {});

  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getDir = function (id) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   *
   * @param {String} name
   * @param {{}}options
   * @param {Array} files
   * @returns {Promise}
   */
  this._createDir = function (name, options, files) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._removeDir = function (id) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._putFile = function (dirId, fileId) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._ejectFile = function (dirId, fileId) {
    return new Promise(function (resolve,reject) {});
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._share = function (id) {
    return new Promise(function (resolve,reject) {});
  };
}

OwnCloudStorage.prototype = new ResourceStorage();
module.exports = OwnCloudStorage;
