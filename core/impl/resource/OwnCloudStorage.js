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
const ShareAccessLevel = require('core/interfaces/ResourceStorage/lib/ShareAccessLevel');

// jshint maxstatements: 30, maxcomplexity: 20

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  var _this = this;

  var ownCloudUrl = url.parse(config.url, true);

  var urlTypes = {
    INDEX: 'index.php/apps/files/?dir=/',
    WEBDAV: 'remote.php/webdav/',
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares'
  };

  var resourceType = {
    FILE: 'file',
    DIR: 'dir'
  };

  function urlResolver(uri, part) {
    if (arguments.length > 1) {
      var result = uri;
      for (var i = 1; i < arguments.length; i++) {
        result = url.resolve(result, encodeURI(arguments[i]));
      }
      return result;
    }
    return uri;
  }

  function slashChecker(path) {
    if (path && path.slice(-1) !== '/') {
      return path   + '/';
    }
    return path || '';
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

  function parseDirId(id) {
    var result = null;
    var urlObj = url.parse(id, true);
    if (urlObj.host === ownCloudUrl.host) {
      if (urlObj.query && urlObj.query.dir) {
        result = urlObj.query.dir;
        if (result.slice(0, 1) === '/') {
          result = result.slice(1);
        }
      } else if (urlObj.path.indexOf(urlTypes.WEBDAV) > -1) {
        result = urlObj.path.replace('/' + urlTypes.WEBDAV, '');
      }
    } else if (!urlObj.host) {
      result = id;
    }

    if (result) {
      return result;
    } else {
      throw new Error('передан не правильный путь до директории');
    }
  }

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getDir = function (id) {
    id = parseDirId(id);
    return new Promise(function (resolve,reject) {
      var reqParams = {
        uri: urlResolver(config.url, urlTypes.WEBDAV, id),
        auth: {
          user: config.login,
          password: config.password
        },
        headers: {
          Depth: '1'
        },
        method: 'PROPFIND'
      };
      request(reqParams, function (err, res, body) {
        var tmp;
        if (!err && res.statusCode === 207) {
          var dirObject = {
            id: id,
            type: resourceType.DIR,
            name: id,
            link: urlResolver(config.url, urlTypes.INDEX, id),
            files: [],
            dirs: []
          };
          try {
            var dom = new Dom();
            var doc = dom.parseFromString(body);
            var dResponse = xpath.select(
              '/*[local-name()="multistatus"]/*[local-name()="response"]',
              doc
            );
            for (var i = 0; i < dResponse.length; i++) {
              var href = xpath.select('*[local-name()="href"]', dResponse[i])[0].firstChild.nodeValue;
              href = decodeURI(href);
              if (i === 0) {
                href = href.replace(urlTypes.WEBDAV, urlTypes.INDEX);
                dirObject.link = urlResolver(config.url, href);
              } else {
                var collection = xpath.select(
                  '*[local-name()="propstat"]/*[local-name()="prop"]/*[local-name()="resourcetype"]' +
                  '/*[local-name()="collection"]',
                  dResponse[i]
                );
                if (collection.length) {
                  href = href.replace(urlTypes.WEBDAV, urlTypes.INDEX);
                  tmp  = url.parse(href, true);
                  dirObject.dirs.push({id: tmp.query.dir.replace(/^\//, ''), link: urlResolver(config.url, href)});
                } else {
                  dirObject.files.push(new StoredFile(
                    href,
                    urlResolver(config.url, href),
                    {name: path.basename(href)},
                    streamGetter(href)
                  ));
                }
              }
            }
            return resolve(dirObject);
          } catch (err) {
            return reject(err);
          }
        } else {
          return resolve(null);
        }
      });
    });
  };

  /**
   *
   * @param {String} name
   * @param {String} parentDirId
   * @param {Boolean} fetch
   * @returns {Promise}
   */
  this._createDir = function (name, parentDirId, fetch) {
    return new Promise(function (resolve,reject) {
      var id = slashChecker(parentDirId) + name;
      var reqParams = {
        uri: urlResolver(
          config.url,
          urlTypes.WEBDAV,
          id
        ),
        auth: {
          user: config.login,
          password: config.password
        },
        method: 'MKCOL'
      };
      request(reqParams, function (err, res) {
        if (!err && res.statusCode === 201) {
          if (fetch) {
            _this._getDir(id).then(resolve).catch(reject);
          } else {
            resolve(null);
          }
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

  function accessLevel(level) {
    switch (level) {
      case ShareAccessLevel.READ: return '1';
      case ShareAccessLevel.WRITE: return '8';
    }
    throw new Error('Некорректное значение уровня доступа!');
  }

  /**
   *
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this._share = function (id, access) {
    return new Promise(function (resolve,reject) {
      var reqObject = {
        uri: urlResolver(slashChecker(config.url), urlTypes.OCS),
        qs: {
          format: 'json'
        },
        auth: {
          user: config.login,
          password: config.password
        },
        form: {
          path: id,
          shareType: '3',
          publicUpload: 'true',
          permissions: access ? accessLevel(access) : '8'
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

  function requestShareIds(id) {
    return new Promise(function (resolve, reject) {
      var reqObject = {
        uri: urlResolver(slashChecker(config.url), urlTypes.OCS),
        qs: {
          path: id
        },
        auth: {
          user: config.login,
          password: config.password
        }
      };
      request.get(reqObject, function (err, res, body) {
        if (err) {
          return reject(err);
        }
        var ids = [];
        var dom = new Dom();
        var doc = dom.parseFromString(body);
        var elements = xpath.select(
          '/*[local-name()="ocs"]/*[local-name()="data"]/*[local-name()="element"]',
          doc
        );
        for (var i = 0; i < elements.length; i++) {
          var shareId = xpath.select('*[local-name()="id"]', elements[i])[0].firstChild.nodeValue;
          if (shareId) {
            ids.push(shareId);
          }
        }
        resolve(ids);
      });
    });
  }

  /**
   *
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this._setShareAccess = function (id, access) {
    id = parseDirId(id);
    return new Promise(function (resolve, reject) {
      requestShareIds(id).then(function (ids) {
        var promises = [];
        ids.forEach(function (shareId) {
          promises.push(new Promise(function (resolve, reject) {
            var reqObject = {
              uri: urlResolver(slashChecker(config.url), slashChecker(urlTypes.OCS), shareId),
              auth: {
                user: config.login,
                password: config.password
              },
              form: {
                permissions: accessLevel(access)
              }
            };
            request.put(reqObject, function (err, res) {
              if (!err && (res.statusCode === 100 || res.statusCode === 200)) {
                resolve(true);
              } else {
                return reject(err || new Error('Status code:' + res.statusCode));
              }
            });
          }));
        });
        Promise.all(promises).then(resolve).catch(reject);
      }).catch(reject);
    });
  };

}

OwnCloudStorage.prototype = new ResourceStorage();
module.exports = OwnCloudStorage;
