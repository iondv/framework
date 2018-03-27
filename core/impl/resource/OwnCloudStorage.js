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
    OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares',
    SHARE: 'index.php/s/'
  };

  let resourceType = {
    FILE: 'file',
    DIR: 'dir'
  };

  function escape(str) {
    let parts = str.split('/');
    let result = [];
    parts.forEach(p => {
      let r = encodeURIComponent(p);
      r = r.replace(/\(/g, '%28');
      r = r.replace(/\)/g, '%29');
      result.push(r);
    });
    return result.join('/');
  }

  function urlResolver(uri, part) {
    if (arguments.length > 1) {
      let result = uri;
      for (let i = 1; i < arguments.length; i++) {
        let tmp = arguments[i];
        if (tmp) {
          if (tmp[0] === '/') {
            tmp = tmp.substr(1);
          }
          result = url.resolve(result, tmp);
        }
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
        let reqParams = {
          uri: encodeURI(urlResolver(config.url, urlTypes.WEBDAV, filePath)),
          auth: {
            user: config.login,
            password: config.password
          }
        };
        callback(null, request.get(reqParams));
      } catch (err) {
        callback(err);
      }
    };
  }

  /**
   * @param {StoredFile} file
   * @returns {Function}
   */
  this._stream = function (file) {
    if (file instanceof StoredFile) {
      return streamGetter(file.id);
    }
    return Promise.resolve(null);
  };

  function checkDir(dir) {
    dir = parseDirId(dir);
    let reqParams = {
      uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, dir)),
      auth: {
        user: config.login,
        password: config.password
      },
      headers: {
        Depth: '0'
      },
      method: 'PROPFIND'
    };

    return new Promise((resolve, reject) => {
      request(reqParams, (err, res, body) => {
        if (err) {
          return reject(err);
        }
        if (!body) {
          return reject(new Error(`Empty response, status: ${res.statusCode}`));
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
      .then(exists => {
        if (exists) {
          return true;
        }
        let parts = dir.split('/').filter(v => v);
        let p;
        parts.forEach((part, i) => {
          if (i < parts.length - 1) {
            let pth = parts.slice(0, i + 1).join('/');
            p = p ? p.then(() => mkdirp(pth)) : mkdirp(pth);
          }
        });
        return p ? p.then(() => _this._createDir(parts.join('/'))) : _this._createDir(parts.join('/'));
      });
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} directory
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, directory, options) {
    try {
      options = options || {};

      if (!data) {
        return Promise.reject(new Error('Нет данных для приема в хранилище.'));
      }

      let fn = null;
      let d = null;
      if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
        d = data;
        fn = options.name || cuid();
      } else if (typeof data === 'object') {
        fn = options.name || data.originalname || data.name || cuid();
        if (typeof data.buffer !== 'undefined') {
          d = data.buffer;
        } else if (typeof data.path !== 'undefined') {
          d = data.path;
        } else if (typeof data.stream !== 'undefined') {
          d = data.stream;
        }
      }

      if (!d) {
        return Promise.reject(new Error('Переданы данные недопустимого типа!'));
      }

      let reader;
      if (typeof d.pipe === 'function') {
        reader = d;
      } else if (Buffer.isBuffer(d)) {
        reader = new stream.PassThrough();
        reader.end(d);
      } else {
        reader = fs.createReadStream(d);
      }

      return (directory ? mkdirp(directory) : Promise.resolve())
        .then(() => {
          let id = urlResolver(slashChecker(directory) || '', fn);
          let reqParams = {
            uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, id)),
            auth: {
              user: config.login,
              password: config.password
            }
          };
          return new Promise((resolve, reject) => {
            reader.pipe(request.put(reqParams, (err, res, body) => {
              if (!err && (res.statusCode === 201 || res.statusCode === 204)) {
                resolve(new StoredFile(id, urlResolver(slashChecker(urlBase), id), {name: fn}, streamGetter(id)));
              } else {
                reject(err || new Error('Status code: ' + res.statusCode + '. ' + res.body));
              }
            }));
          });
        });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    let reqParams = {
      uri: encodeURI(urlResolver(config.url, urlTypes.WEBDAV, id)),
      auth: {
        user: config.login,
        password: config.password
      }
    };
    return new Promise((resolve,reject) => {
      request.delete(reqParams, (err, res, body) => {
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
      let result = [];
      if (Array.isArray(ids)) {
        ids.forEach(id => {
          let parts = id.split('/');
          result.push(
            new StoredFile(
              id,
              urlResolver(slashChecker(urlBase), id),
              {name: parts[parts.length - 1]},
              streamGetter(id)
            )
          );
        });
      }
      resolve(result);
    });
  };

  function respondFile(req, res) {
    return (file) => {
      if (file && file.stream) {
        file.stream.on('response', (response) => {
          if (response.statusCode === 200) {
            res.status(200);
            res.set('Content-Disposition',
              (req.query.dwnld ? 'attachment' : 'inline') + '; filename="' + encodeURIComponent(file.name) +
              '";filename*=UTF-8\'\'' + encodeURIComponent(file.name));
            res.set(
              'Content-Type',
              response.headers['content-type'] || file.options.mimetype || 'application/octet-stream'
            );
            res.set('Content-Length', response.headers['content-length'] || file.options.size);
            res.set('Content-Encoding', response.headers['content-encoding'] || file.options.encoding);
            file.stream.pipe(res);
          } else {
            res.status(404).send('File not found!');
          }
        });
      } else {
        res.status(404).send('File not found!');
      }
    };
  }

  /**
   * @returns {Function}
   */
  this._fileMiddle = function () {
    return function (req, res, next) {
      let fileId = req.params.id;
      if (!fileId) {
        return next();
      }

      _this.fetch([decodeURI(fileId)])
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

  this._fileRoute = function () {
    return urlBase + '/:id(([^/]+/?[^/]+)*)';
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return Promise.resolve();
  };

  function parseDirId(id) {
    let result = null;
    let urlObj = url.parse(id, true);
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

  function parseShareId(id) {
    let result = null;
    let urlObj = url.parse(id, true);
    if (urlObj.host === ownCloudUrl.host) {
      if (urlObj.path.indexOf(urlTypes.SHARE) > -1) {
        result = urlObj.path.replace('/' + urlTypes.SHARE, '');
      }
    } else if (!urlObj.host) {
      result = id;
    }

    if (result) {
      return result;
    } else {
      throw new Error('Передан неправильный адрес share');
    }
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._getDir = function (id) {
    id = parseDirId(id);
    let reqParams = {
      uri: urlResolver(config.url, urlTypes.WEBDAV, escape(id)),
      auth: {
        user: config.login,
        password: config.password
      },
      headers: {
        Depth: '1'
      },
      method: 'PROPFIND'
    };
    return new Promise(function (resolve,reject) {
      request(reqParams, function (err, res, body) {
        let tmp;
        if (!err && res.statusCode === 207) {
          let dirObject = {
            id: id,
            type: resourceType.DIR,
            name: id,
            link: urlResolver(config.url, urlTypes.INDEX, id),
            files: [],
            dirs: []
          };
          try {
            let dom = new Dom();
            let doc = dom.parseFromString(body);
            let dResponse = xpath.select(
              '/*[local-name()="multistatus"]/*[local-name()="response"]',
              doc
            );
            for (let i = 0; i < dResponse.length; i++) {
              let href = xpath.select('*[local-name()="href"]', dResponse[i])[0].firstChild.nodeValue;
              href = decodeURI(href);
              if (i === 0) {
                href = href.replace(urlTypes.WEBDAV, urlTypes.INDEX);
                dirObject.link = urlResolver(config.url, href);
              } else {
                let collection = xpath.select(
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
    let id = slashChecker(parentDirId) + name;
    let reqParams = {
      uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, id)),
      auth: {
        user: config.login,
        password: config.password
      },
      method: 'MKCOL'
    };
    return new Promise((resolve,reject) => {
      request(reqParams, (err, res) => {
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
    let fileName = path.basename(fileId);
    let reqParams = {
      uri: encodeURI(urlResolver(config.url, urlTypes.WEBDAV, fileId)),
      auth: {
        user: config.login,
        password: config.password
      },
      headers: {
        Destination: encodeURI(urlResolver(config.url, urlTypes.WEBDAV, slashChecker(dirId), fileName))
      },
      method: 'MOVE'
    };
    return new Promise((resolve,reject) => {
      request(reqParams, (err, res, body) => {
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
      case ShareAccessLevel.WRITE: return '15';
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
    let reqObject = {
      uri: encodeURI(urlResolver(slashChecker(config.url), urlTypes.OCS)),
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
        publicUpload: access === ShareAccessLevel.WRITE ? 'true' : 'false',
        permissions: access ? accessLevel(access) : '8'
      }
    };
    return new Promise((resolve,reject) => {
      request.post(reqObject, (err, res, body) => {
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

  function shareDeleteConstr(share) {
    let reqObject = {
      uri: encodeURI(urlResolver(slashChecker(config.url), slashChecker(urlTypes.OCS), share.id)),
      headers: {
        'OCS-APIRequest': true
      },
      auth: {
        user: config.login,
        password: config.password
      }
    };
    return new Promise((resolve, reject) => {
      request.delete(reqObject, (err, res) => {
        if (!err && (res.statusCode === 100 || res.statusCode === 200)) {
          resolve(true);
        } else {
          return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
        }
      });
    });
  }

  this._deleteShare = function (share) {
    let requester;
    try {
      requester = requestShares(parseDirId(share));
    } catch (e) {
      requester = Promise.resolve([parseShareId(share)]);
    }
    return requester
      .then(shares => {
        let promise;
        shares.forEach(share => {
          promise = promise ? promise.then(()=>shareDeleteConstr(share)) : shareDeleteConstr(share);
        });
        return promise.then(()=>true) || Promise.resolve(true);
      });
  };

  function requestShares(id) {
    let reqObject = {
      uri: encodeURI(urlResolver(slashChecker(config.url), urlTypes.OCS)),
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
    return new Promise((resolve, reject) => {
      request.get(reqObject, (err, res, body) => {
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
          for (let i = 0; i < elements.length; i++) {
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

  function shareAccessConstructor(share, access) {
    let reqObject = {
      uri: encodeURI(urlResolver(slashChecker(config.url), slashChecker(urlTypes.OCS), share.id)),
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
    return new Promise((resolve, reject) => {
      request.put(reqObject, (err, res) => {
        if (!err && (res.statusCode === 100 || res.statusCode === 200)) {
          resolve(true);
        } else {
          return reject(err || new Error('Status code:' + res.statusCode + '. ' + res.body.message));
        }
      });
    });
  }

  /**
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this._setShareAccess = function (id, access) {
    id = parseDirId(id);
    return requestShares(id)
      .then((shares) => {
        let promise;
        shares.forEach((share) => {
          promise = promise ?
            promise.then(() => shareAccessConstructor(share, access)) :
            shareAccessConstructor(share, access);
        });
        return promise || Promise.resolve();
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
