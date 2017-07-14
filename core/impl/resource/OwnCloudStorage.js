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

// jshint maxstatements: 100, maxcomplexity: 20

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  let _this = this;

  let urlBase = config.urlBase  || '';
  let ownCloudUrl = url.parse(config.url, true);

  let urlTypes = {
    INDEX: 'index.php/apps/files/?dir=/',
    WEBDAV: `remote.php/dav/files/${config.login}/`,
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares'
  };

  let resourceType = {
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
    return uri;
  }

  function urlConcat(part) {
    if (arguments.length > 1) {
      let result = slashChecker(arguments[0]);
      for (let i = 1; i < arguments.length; i++) {
        result += slashChecker(arguments[i]);
      }
      return result;
    }
    return part;
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

  function checkDir(dir) {
    dir = parseDirId(dir);
    return new Promise(function (resolve,reject) {
      var reqParams = {
        uri: urlConcat(config.url, urlTypes.WEBDAV, dir),
        auth: {
          user: config.login,
          password: config.password
        },
        headers: {
          Depth: '0'
        },
        method: 'PROPFIND'
      };
      request(reqParams, function (err, res, body) {
        if (err) {
          return reject(err);
        }
        if (!body) {
          return reject(new Error(`empty response, status: ${res.statusCode}`));
        }
        try {
          let dom = new Dom();
          let doc = dom.parseFromString(body);
          let dResponse = xpath.select(
            '/*[local-name()="multistatus"]/*[local-name()="response"]',
            doc
          );
          if (!dResponse.length) {
            return resolve(false);
          }
          resolve(true);
        } catch (err) {
          return reject(err);
        }
      });
    });
  }

  function mkdirp(path) {
    let dir = parseDirId(path);
    return checkDir(dir)
      .then(exist => {
        if (exist) {
          return true;
        }
        let dirs = dir.split('/').filter(v => v);
        let i = 0;
        function execute() {
          return new Promise(function (resolve, reject) {
            if (i < dirs.length) {
              let d = dirs.slice(0, i + 1).join('/');
              i++;
              return checkDir(d)
                .then(exist => {
                  if (exist) {
                    return true;
                  }
                  return _this._createDir(d);
                })
                .then(done => execute())
                .then(resolve)
                .catch(reject);
            } else {
              return resolve(true);
            }
          });
        }
        return execute();
      });
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} directory
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, directory, options) {
    return new Promise(function (resolve,reject) {
      try {
        options = options || {};
        var d,fn,reader;

        if (typeof data === 'object' && (
          typeof data.buffer !== 'undefined' ||
          typeof data.path !== 'undefined' ||
          typeof data.stream !== 'undefined'
        )) {
          fn = options.name || data.originalname || data.name || cuid();
          if (typeof data.buffer !== 'undefined') {
            d = data.buffer;
          } else if (typeof data.path !== 'undefined') {
            d = data.path;
          } else if (typeof data.stream !== 'undefined') {
            d = data.stream;
          }
        } else if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
          d = data;
          fn = options.name || cuid();
        }

        if (!d) {
          return reject(new Error('Переданы данные недопустимого типа!'));
        }

        if (typeof d.pipe === 'function') {
          reader = d;
        } else if (Buffer.isBuffer(d)) {
          reader = new stream.PassThrough();
          reader.end(d);
        } else {
          reader = fs.createReadStream(d);
        }

        let mkdir = directory ? mkdirp(directory) : Promise.resolve(true);
        mkdir.then(done => {
          let id = urlResolver(slashChecker(directory) || '', fn);
          let reqParams = {
            uri: urlConcat(config.url, urlTypes.WEBDAV, id),
            auth: {
              user: config.login,
              password: config.password
            }
          };
          reader.pipe(request.put(reqParams, function (err, res, body) {
            if (!err && (res.statusCode === 201 || res.statusCode === 204)) {
              return resolve(new StoredFile(
                id,
                urlResolver(slashChecker(urlBase), id),
                {name: fn},
                streamGetter(id)
              ));
            } else {
              return reject(err || new Error('Status code: ' + res.statusCode + '. ' + res.body));
            }
          }));
        }).catch(reject);
      } catch (err) {
        reject(err);
      }
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
          return reject(err || new Error('Status code: ' + res.statusCode + '. ' + res.body));
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
      if (Array.isArray(ids)) {
        ids.forEach(id => {
          var parts = id.split('/');
          result.push(new StoredFile(
            id,
            urlResolver(slashChecker(urlBase), id),
            {name: parts[parts.length - 1]},
            streamGetter(id)
          ));
        });
      }
      resolve(result);
    });
  };

  function respondFile(req, res) {
    return function (file) {
      if (file && file.stream) {
        res.status(200);
        res.set('Content-Disposition',
          (req.query.dwnld ? 'attachment' : 'inline') + '; filename="' + encodeURIComponent(file.name) +
          '";filename*=UTF-8\'\'' + encodeURIComponent(file.name));
        res.set('Content-Type', file.options.mimetype || 'application/octet-stream');
        if (file.options.size) {
          res.set('Content-Length', file.options.size);
        }
        if (file.options.encoding) {
          res.set('Content-Encoding', file.options.encoding);
        }
        file.stream.pipe(res);
      } else {
        res.status(404).send('File not found!');
      }
    };
  }

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return function (req, res, next) {
      let basePath = url.parse(urlBase).path;
      if (!basePath || req.path.indexOf(basePath) !== 0) {
        return next();
      }

      let fileId = req.path.replace(basePath + '/', '');
      if (!fileId) {
        return next();
      }

      _this.fetch([fileId])
        .then(files => {
          if (!files[0]) {
            return res.status(404).send('File not found!');
          }
          return files[0].getContents()
            .then(respondFile(req, res))
            .catch(err => res.status(404).send('File not found!'));
        })
        .catch(err => {
          res.status(500).send(err.message);
        });
    };
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
      throw new Error('Передан неправильный путь до директории');
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
        uri: urlConcat(config.url, urlTypes.WEBDAV, id),
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
          return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body));
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
          return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
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
        headers: {
          'OCS-APIRequest': true
        },
        auth: {
          user: config.login,
          password: config.password
        },
        form: {
          path: id,
          shareType: '3',
          // PublicUpload: 'true',
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
          return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
        }
      });
    });
  };

  this._deleteShare = function (share) {
    return requestShares(parseDirId(share))
      .then(shares => {
        let promises = [];
        shares.forEach(share => {
          promises.push(new Promise(function (resolve, reject) {
            let reqObject = {
              uri: urlResolver(slashChecker(config.url), slashChecker(urlTypes.OCS), share.id),
              headers: {
                'OCS-APIRequest': true
              },
              auth: {
                user: config.login,
                password: config.password
              }
            };
            request.delete(reqObject, function (err, res) {
              if (!err && (res.statusCode === 100 || res.statusCode === 200)) {
                resolve(true);
              } else {
                return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
              }
            });
          }));
        });
        return Promise.all(promises);
      })
      .then(result => true);
  };

  function requestShares(id) {
    return new Promise(function (resolve, reject) {
      let reqObject = {
        uri: urlResolver(slashChecker(config.url), urlTypes.OCS),
        qs: {
          path: id
        },
        headers: {
          'OCS-APIRequest': true
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
        try {
          let result = [];
          let dom = new Dom();
          let doc = dom.parseFromString(body);
          let elements = xpath.select(
            '/*[local-name()="ocs"]/*[local-name()="data"]/*[local-name()="element"]',
            doc
          );
          for (var i = 0; i < elements.length; i++) {
            let shareId = xpath.select('*[local-name()="id"]', elements[i])[0].firstChild.nodeValue;
            let shareUrl = xpath.select('*[local-name()="url"]', elements[i])[0].firstChild.nodeValue;
            if (shareId) {
              result.push({id: shareId, url: shareUrl});
            }
          }
          resolve(result);
        } catch (err) {
          reject(err);
        }
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
      requestShares(id).then((shares) => {
        var promises = [];
        shares.forEach((share) => {
          promises.push(new Promise(function (resolve, reject) {
            var reqObject = {
              uri: urlResolver(slashChecker(config.url), slashChecker(urlTypes.OCS), share.id),
              headers: {
                'OCS-APIRequest': true
              },
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
                return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
              }
            });
          }));
        });
        Promise.all(promises).then(resolve).catch(reject);
      }).catch(reject);
    });
  };

  /**
   *
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this._currentShare = function (id, access) {
    return requestShares(parseDirId(id))
      .then(shares => {
        if (shares[0]) {
          return shares[0].url;
        }
        return null;
      });
  };

  this.fileOptionsSupport = function () {
    return false;
  };
}

OwnCloudStorage.prototype = new ResourceStorage();
module.exports = OwnCloudStorage;
