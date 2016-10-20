/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/11/16.
 */
'use strict';

const request = require('request');
const fs = require('fs');
const url = require('url');
const path = require('path');
const stream = require('stream');
const cuid = require('cuid');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const utf8 = require('utf8');

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  var _this = this;

  var urlTypes = {
    WEBDAV: 'remote.php/webdav/',
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares?format=json'
  };

  var resourceType = {
    FILE: 'file',
    DIR: 'dir'
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

  function slashChecker(path) {
    if (path && path.slice(-1) !== '/') {
      path  = path   + '/';
    }
    return path;
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

      options = options || {};
      var d,fn,reader;

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
      } else if (Buffer.isBuffer(d)) {
        reader = new stream.PassThrough();
        reader.end(d);
      } else {
        reader = fs.createReadStream(d);
      }

      var id = urlResolver(slashChecker(directory) || '', fn);
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, id),
        auth: {
          user: config.login,
          password: config.password
        }
      };

      reader.pipe(request.put(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 201) {
          resolve(new StoredFile(
            id,
            reqParams.uri,
            {name: fn},
            streamGetter(id)
          ));
        } else {
          reject(err || new Error('Status code: ' + res.statusCode));
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
        if (!err && res.statusCode === 204) {
          return resolve(id);
        } else {
          return reject(err || new Error('Status code: ' + res.statusCode));
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
    return new Promise(function (resolve,reject) {
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, utf8.encode(decodeURI(id))),
        auth: {
          user: config.login,
          password: config.password
        },
        method: 'PROPFIND'
      };
      request(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 207) {
          var dirObject = {
            id: id,
            type: resourceType.DIR,
            name: id,
            link: urlResolver(config.url, urlTypes.WEBDAV, id),
            files: [],
            dirs: []
          };
          try {
            var dom = new Dom();
            var doc = dom.parseFromString(body);
            var dResponse = xpath.select(
              '/*[local-name()="multistatus"]/*[local-name()="response"][position()>1]',
              doc
            );
            for (var i = 0; i < dResponse.length; i++) {
              var href = xpath.select('*[local-name()="href"]', dResponse[i])[0].firstChild.data;
              href = decodeURI(href);
              href = href.replace('/' + urlTypes.WEBDAV, '');
              var collection = xpath.select(
                '*[local-name()="propstat"]/*[local-name()="prop"]/*[local-name()="resourcetype"]/*[local-name()="collection"]',
                dResponse[i]
              );
              if (collection.length) {
                dirObject.dirs.push({id: href, link: urlResolver(config.url, urlTypes.WEBDAV, href)});
              } else {
                dirObject.files.push(new StoredFile(
                  href,
                  urlResolver(config.url, urlTypes.WEBDAV, href),
                  {name: path.basename(href)},
                  streamGetter(href)
                ));
              }
            }
            return resolve(dirObject);
          } catch (err) {
            return reject(err);
          }
        } else {
          return reject(err || new Error('Status code:' + res.statusCode));
        }
      });
    });
  };

  /**
   *
   * @param {String} name
   * @param {String} parentDirId
   * @returns {Promise}
   */
  this._createDir = function (name, parentDirId) {
    return new Promise(function (resolve,reject) {
      var reqParams = {
        uri: urlResolver(
          config.url,
          urlTypes.WEBDAV,
          utf8.encode(urlResolver(slashChecker(parentDirId) || '', name))
        ),
        auth: {
          user: config.login,
          password: config.password
        },
        method: 'MKCOL'
      };
      request(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 201) {
          resolve(name);
        } else {
          return reject(err || new Error('Status code:' + res.statusCode));
        }
      });
    });
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._removeDir = function (id) {
    return _this.remove(id);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._putFile = function (dirId, fileId) {
    return new Promise(function (resolve,reject) {
      var fileName = path.basename(fileId);
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, fileId),
        auth: {
          user: config.login,
          password: config.password
        },
        headers: {
          Destination: urlResolver(config.url, urlTypes.WEBDAV, slashChecker(dirId), fileName)
        },
        method: 'MOVE'
      };
      request(reqParams, function (err, res, body) {
        if (!err && res.statusCode === 201) {
          resolve(urlResolver(slashChecker(dirId, fileName)));
        } else {
          return reject(err || new Error('Status code:' + res.statusCode));
        }
      });
    });
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._ejectFile = function (dirId, fileId) {
    return _this.remove(urlResolver(slashChecker(dirId), fileId));
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._share = function (id) {
    return new Promise(function (resolve,reject) {
      var reqObject = {
        uri: urlResolver(slashChecker(config.url), urlTypes.OCS),
        auth: {
          user: config.login,
          password: config.password
        },
        form: {
          path: id,
          shareType: '3',
          publicUpload: 'true',
          permissions: '8'
        }
      };
      request.post(reqObject, function (err, res, body) {
        if (!err && res.statusCode === 200) {
          if (typeof body === 'string') {
            body = JSON.parse(body);
          }
          resolve(body.ocs && body.ocs.data.url);
        } else {
          return reject(err || new Error('Status code:' + res.statusCode));
        }
      });
    });
  };

}

OwnCloudStorage.prototype = new ResourceStorage();
module.exports = OwnCloudStorage;
