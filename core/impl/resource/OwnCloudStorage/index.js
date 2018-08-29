/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/11/16.
 */
'use strict';

const request = require('request');
const moment = require('moment');
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
const Share = require('core/interfaces/ResourceStorage/lib/Share');
const SharesApi = require('./SharesApi');
const {urlResolver, slashChecker} = require('./util');

// jshint maxstatements: 100, maxcomplexity: 20

function OwnCloudStorage(config) {

  if (!config.url || !config.login || !config.password) {
    throw new Error('не указаны параметры подключения к OwnCloud (url, login, password)');
  }

  let _this = this;

  const urlBase = config.urlBase  || '';

  const ownCloudUrl = url.parse(config.url, true);

  const sharesApi = new SharesApi(config);

  const urlTypes = {
    INDEX: 'index.php/apps/files/?dir=/',
    WEBDAV: `remote.php/dav/files/${config.login}/`
  };

  let resourceType = {
    FILE: 'file',
    DIR: 'dir'
  };

  function escape(str) {
    let parts = str.split('/');
    let result = [];
    parts.forEach((p) => {
      let r = encodeURIComponent(p);
      r = r.replace(/\(/g, '%28');
      r = r.replace(/\)/g, '%29');
      result.push(r);
    });
    return result.join('/');
  }

  function trimSlashes(str) {
    let result = str;
    if (result) {
      while (result.slice(0, 1) === '/') {
        result = result.slice(1);
      }
      while (result.slice(-1) === '/') {
        result = result.slice(0, -1);
      }
    }
    return result;
  }

  function urlConcat(part) {
    if (arguments.length > 1) {
      let result = trimSlashes(arguments[0]) + '/';
      for (let i = 1; i < arguments.length; i++) {
        result += trimSlashes(arguments[i]) + '/';
      }
      return result;
    }
    return part;
  }

  function streamGetter(filePath) {
    return (callback) => {
      try {
        let reqParams = {
          uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, filePath)),
          auth: {
            user: config.login,
            password: config.password
          }
        };

        let obtained = false;
        let getStream = request.get(reqParams).on('error', (err) => {
          if (!obtained) {
            getStream.resume();
            callback(err);
          }
        });
        getStream.pause();
        getStream
          .on('response', (res) => {
            obtained = true;
            if (res.statusCode !== 200) {
              return callback(new Error('Не удалось получить файл из удаленного хранилища! Код ошибки (' + res.statusCode + ').'));
            }

            let piper = getStream.pipe;
            let on = getStream.on;
            getStream.pipe = function (dest) {
              piper.call(this, dest);
              getStream.resume();
              return dest;
            };
            getStream.on = function (event) {
              on.apply(this, arguments);
              if (event === 'data') {
                getStream.resume();
              }
              return this;
            };
            callback(null, getStream);
          });
      } catch (err) {
        callback(err);
      }
    };
  }

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
      .then((exists) => {
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
          let id = urlConcat(directory || '', fn);
          let reqParams = {
            uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, id)),
            auth: {
              user: config.login,
              password: config.password
            }
          };
          return new Promise((resolve, reject) => {
            reader.pipe(request.put(reqParams, (err, res) => {
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
      uri: encodeURI(urlConcat(config.url, urlTypes.WEBDAV, id)),
      auth: {
        user: config.login,
        password: config.password
      }
    };
    return new Promise((resolve,reject) => {
      request.delete(reqParams, (err, res) => {
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
    return new Promise((resolve) => {
      let result = [];
      if (Array.isArray(ids)) {
        ids.forEach((id) => {
          if (typeof id === 'string') {
            let parts = id.split('/');
            result.push(
              new StoredFile(
                id,
                urlResolver(slashChecker(urlBase), id),
                {name: parts[parts.length - 1]},
                streamGetter(id)
              )
            );
          }
        });
      }
      resolve(result);
    });
  };

  function respondFile(req, res) {
    return (file) => {
      if (file && file.stream) {
        let options = file.options || {};
        res.status(200);
        res.set('Content-Disposition',
          (req.query.dwnld ? 'attachment' : 'inline') + '; filename="' + encodeURIComponent(file.name) +
          '";filename*=UTF-8\'\'' + encodeURIComponent(file.name));
        res.set('Content-Type', options.mimetype || 'application/octet-stream');
        if (options.size) {
          res.set('Content-Length', options.size);
        }
        if (options.encoding) {
          res.set('Content-Encoding', options.encoding);
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
  function fileMiddle() {
    return function (req, res, next) {
      let originalUrl = req.originalUrl;
      if (!originalUrl) {
        return next();
      }
      let fileId = originalUrl.replace(urlBase, '');
      if (!fileId) {
        return next();
      }

      _this.fetch([decodeURI(fileId)])
        .then((files) => {
          if (!files[0]) {
            return res.status(404).send('Файл не найден!');
          }
          return files[0].getContents()
            .then(respondFile(req, res))
            .catch(() => res.status(404).send('Файл не найден!'));
        })
        .catch((err) => {
          res.status(500).send(err.message);
        });
    };
  }

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
      request(reqParams, (err, res) => {
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

  function createShare(id, access, options) {
    options = options || {};
    const acs = access || options.permissions;
    const permissions = typeof acs === 'number' ? acs.toString() : (acs ? sharesApi.accessLevel(acs) : '8');
    const form = {
      path: id,
      publicUpload: 'false'
    };
    if (options.password) {
      form.password = options.password;
    }
    if (options.expiration) {
      let expDate = moment(options.expiration).format('YYYY-MM-DD');
      if (expDate && expDate !== 'Invalid date') {
        form.expiration = expDate;
      }
    }
    if (options.shareWith) {
      form.shareWith = options.shareWith;
      form.shareType = '0';
    } else {
      form.shareType = '3';
    }
    return sharesApi.create(form)
      .then((shares) => {
        let result = Array.isArray(shares) ? shares[0] : shares;
        if (permissions === sharesApi.accessLevel(ShareAccessLevel.READ)) {
          return result;
        }
        return sharesApi.update(result.id, {permissions})
          .then((upd) => {
            result.permissions = upd.permissions;
            return result;
          });
      });
  }

  function updateShare(shareId, access, options) {
    let promise = Promise.resolve({});
    if (access || options.permissions) {
      const acs = access || options.permissions;
      const permissions = typeof acs === 'number' ? acs.toString() : (acs ? sharesApi.accessLevel(acs) : '8');
      promise = sharesApi.update(shareId, {permissions});
    }
    if (options.password || options.password === false) {
      promise = promise.then(() => sharesApi.update(shareId, {password: options.password || null}));
    }
    if (options.expiration) {
      let expDate = moment(options.expiration);
      if (expDate.isValid()) {
        promise = promise.then(() => sharesApi.update(shareId, {expireDate: expDate.format('YYYY-MM-DD')}));
      }
    } else if (options.expiration === false) {
      promise = promise.then(() => sharesApi.update(shareId, {expireDate: ''}));
    }
    return promise;
  }

  function findShare(token) {
    return sharesApi.get()
      .then((shares) => {
        let result;
        if (Array.isArray(shares)) {
          result = shares.filter(s => s.token === token)[0];
        }
        if (!result) {
          throw new Error('share not found');
        }
        return result;
      });
  }

  function requestShare(path) {
    let id;
    try {
      id = parseDirId(path);
    } catch (e) {
      // Do nothing
    }
    if (typeof id !== 'undefined') {
      return sharesApi.get(id);
    } else {
      try {
        id = sharesApi.parseToken(path);
      } catch (e) {
        // Do nothing
      }
      if (typeof id !== 'undefined') {
        return findShare(id);
      }
    }
    return Promise.reject(new Error('Передан неправильный путь до share'));
  }

  function parseUserPermissions(user) {
    let permissions = 1;
    if (user.permissions) {
      if (user.permissions.update === true) {
        permissions |= 2;
      }
      if (user.permissions.create === true) {
        permissions |= 4;
      }
      if (user.permissions.delete === true) {
        permissions |= 8;
      }
      if (user.permissions.share === true) {
        permissions |= 16;
      }
    }
    return permissions;
  }

  function getShareOptions(obj, user) {
    if (!obj) {
      return obj;
    }
    let result = {};
    let properties = ['permissions', 'expiration', 'password'];
    properties.forEach((name) => {
      if (typeof obj[name] !== 'undefined') {
        result[name] = obj[name];
      }
    });
    if (user) {
      result.shareWith = user.name;
      result.permissions = parseUserPermissions(user);
    }
    return result;
  }

  /**
   *
   * @param {String} id
   * @param {String} [access]
   * @param {{}} [options]
   * @param {Array} [options.shareWith]
   * @returns {Promise<Share>}
   */
  this._share = function (id, access, options) {
    let dirId;
    try {
      dirId = parseDirId(id);
    } catch (err) {
      return Promise.reject(new Error('Передан неправильный путь до директории'));
    }
    return sharesApi.get(dirId)
      .then((shares) => {
        let result = [];
        let promise = Promise.resolve();
        let addShare = shareInfo => result.push(new Share(shareInfo.shareUrl, shareInfo));
        if (options && Array.isArray(options.shareWith) && Array.isArray(config.users)) {
          options.shareWith.forEach((sw) => {
            const user = config.users.filter(u => u.name === sw)[0];
            if (typeof user === 'undefined') {
              return;
            }
            let currentShare = shares.filter(s => parseInt(s.share_type) === 0 && s.share_with === sw)[0];
            if (typeof currentShare !== 'undefined') {
              promise = promise.then(() => updateShare(currentShare.id, null, getShareOptions(options, user)).then(addShare));
            } else {
              promise = promise.then(() => createShare(dirId, null, getShareOptions(options, user)).then(addShare));
            }
          });
        } else {
          let publicShare;
          if (Array.isArray(shares) && shares.length > 0) {
            publicShare = shares.filter(s => parseInt(s.share_type) === 3)[0];
          }
          if (typeof publicShare !== 'undefined') {
            promise = promise.then(() => updateShare(publicShare.id, access, getShareOptions(options)).then(addShare));
          } else {
            promise = promise.then(() => createShare(dirId, access, getShareOptions(options)).then(addShare));
          }
        }
        return promise.then(() => result);
      })
      .then((result) => {
        if (result.length > 1) {
          return result;
        } else if (result.length === 1) {
          return result[0];
        }
        return null;
      });
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._deleteShare = function (id) {
    return requestShare(id)
      .then((shares) => {
        shares = Array.isArray(shares) ? shares : [shares];
        let promise = Promise.resolve();
        shares.forEach((share) => {
          promise = promise.then(() => sharesApi.delete(share.id));
        });
        return promise.then(() => true);
      });
  };

  /**
   * @param {String} id
   * @param {String} access
   * @returns {Promise}
   */
  this._setShareAccess = function (id, access) {
    const update = {permissions: sharesApi.accessLevel(access)};
    return requestShare(id)
      .then((shares) => {
        shares = Array.isArray(shares) ? shares : [shares];
        let promise = Promise.resolve();
        shares.forEach((shareOptions) => {
          promise = promise.then(() => sharesApi.update(shareOptions.id, update));
        });
        return promise;
      });
  };

  /**
   *
   * @param {String} id
   * @returns {Promise<Share>}
   */
  this._currentShare = function (id) {
    return requestShare(id).then(shares => Array.isArray(shares) ? shares[0] : shares);
  };

  this.fileOptionsSupport = function () {
    return false;
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    if (config.app) {
      if (config.auth && urlBase) {
        config.app.get(urlBase + '/:id*', config.auth.verifier(), fileMiddle());
      }
    }
    return Promise.resolve();
  };
}

OwnCloudStorage.prototype = new ResourceStorage();
module.exports = OwnCloudStorage;
