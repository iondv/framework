/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/11/16.
 */
'use strict';

var request = require('request');
var fs = require('fs');
var url = require('url');
var cuid = require('cuid');
var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
var StoredFile = require('core/interfaces/ResourceStorage').StoredFile;

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  var _this = this;
  var urlTypes = {
    WEBDAV: 'remote.php/webdav/',
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares?format=json'
  };

  function urlResolver(uri, part) {
    if (arguments.length > 1) {
      var result = uri;
      for (var i = 1; i < arguments.length; i++) {
        result = url.resolve(result, arguments[i]);
      }
      return result;
    }
    return url;
  }

  function streamGetter(filePath) {
    return function (callback) {
      try {
        var reqParams = {
          uri: urlResolver(config.url, urlTypes.WEBDAV, filePath),
          auth: {
            user: config.login,
            password: config.password
          }
        };
        var s = request.get(reqParams);
        callback(null, s);
      } catch (err) {
        callback(err);
      }
    };
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} directory
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, directory, options) {
    return new Promise(function (resolve,reject) {

      var d,fn,reader;
      if (directory && directory.slice(-1) !== '/') {
        directory = directory + '/';
      }

      if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
        fn = options.name || data.originalname || data.name || cuid();
        if (typeof data.buffer !== 'undefined') {
          d = data.buffer;
        } else if (typeof data.path !== 'undefined') {
          d = data.path;
        }
      } else if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
        d = data;
        fn = options.name || cuid();
      }

      if (!d) {
        throw new Error('Переданы данные недопустимого типа!');
      }

      if (typeof d.pipe === 'function') {
        reader = d;
      } else {
        reader = fs.createReadStream(d);
      }

      var id = urlResolver(directory || '', fn);
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, id),
        auth: {
          user: config.login,
          password: config.password
        }
      };

      reader.pipe(request.put(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 200) {
          resolve(new StoredFile(
            id,
            reqParams.uri,
            {name: fn},
            streamGetter(id)
          ));
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
    return new Promise(function (resolve,reject) {
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, id),
        auth: {
          user: config.login,
          password: config.password
        }
      };
      request.delete(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 200) {
          return resolve(id);
        } else {
          return reject(err || 'ошибка удаления');
        }
      });
    });
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return new Promise(function (resolve,reject) {
      var result = [];
      for (var i = 0; i < ids.length; i++) {
        var parts = ids.split('/');
        result.push(new StoredFile(
          ids[i],
          urlResolver(config.url, urlTypes.WEBDAV, ids[i]),
          {name: parts[parts.length - 1]},
          streamGetter(ids[i])
        ));
      }
      resolve(result);
    });
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return function () {};
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve,reject) {
      resolve();
    });
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
