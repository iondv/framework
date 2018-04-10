/**
 * Created by kras on 14.07.16.
 */
'use strict';

const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const F = require('core/FunctionCodes');
const moment = require('moment');
const fs = require('fs');
const url = require('url');
const path = require('path');
const cuid = require('cuid');
const merge = require('merge');
const clone = require('clone');
const mkdirp = require('mkdirp');
const xss = require('xss');

/* jshint maxcomplexity: 20, maxstatements: 30 */
/**
 * @param {{storageBase: String, urlBase: String, dataSource: DataSource, fragmentation: String}} options
 * @constructor
 */
function FsStorage(options) {
  var _this = this;

  var resourceType = {
    FILE: 'file',
    DIR: 'dir'
  };

  /**
   * @type {DataSource}
   */
  var dataSource = options.dataSource;
  if (!dataSource) {
    throw new Error('Не указан источник данных файлового хранилища!');
  }

  delete options.dataSource;
  var _options = clone(options) || {};
  _options.urlBase = _options.urlBase  || '';
  _options.shareBase = _options.shareBase  || '/share';
  _options.storageBase = path.resolve(path.join(__dirname, '..', '..', '..'), _options.storageBase || './files');

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} [directory]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, directory, options) {
    let opts = clone(options) || {};
    let m = moment();
    let pth = directory ? directory : m.format('YYYY' + path.sep + 'MM' + path.sep + 'DD');
    if (pth.charAt(0) === path.sep) {
      pth = pth.slice(1);
    }
    switch (_options.fragmentation) {
      case 'hour':pth = path.join(pth, m.format('HH'));break;
      case 'minute':pth = path.join(pth, m.format('mm'));break;
    }

    let d, fn;
    let id = cuid();

    if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
      d = data;
      fn = opts.name || id;
    } else if (
      typeof data === 'object' &&
      (
        typeof data.buffer !== 'undefined' ||
        typeof data.path !== 'undefined' ||
        typeof data.stream !== 'undefined'
      )
    ) {
      fn = opts.name || data.originalname || data.name || id;
      if (typeof data.buffer !== 'undefined') {
        d = data.buffer;
      } else if (typeof data.path !== 'undefined') {
        d = data.path;
      } else if (typeof data.stream !== 'undefined') {
        d = data.stream;
      }

      let dt = clone(data);
      delete dt.buffer;
      delete dt.path;
      delete dt.stream;

      opts = merge(opts, dt);
    } else {
      throw new Error('Переданы данные недопустимого типа:!');
    }

    function checkDest(filename, prompt) {
      return new Promise((resolve, reject) => {
        let result = path.join(_options.storageBase, pth, filename);
        fs.access(result, (err) => {
          if (err) {
            resolve({path: pth, filename: filename});
            return;
          }
          let p = 1 + (prompt || 0);
          let lind = filename.lastIndexOf('.');
          let fn = lind > 0 ? filename.substring(0, lind) + p + filename.substring(lind) : filename + p;

          checkDest(fn, p).then(resolve).catch(reject);
        });
      });
    }

    return checkDest(fn)
      .then((check) => {
        return new Promise((resolve, reject) => {
          mkdirp(path.join(_options.storageBase, check.path), (err) => {
            if (err) {
              return reject(err);
            }

            let dest = path.join(_options.storageBase, check.path, check.filename);

            if (typeof d === 'string' || typeof d.pipe === 'function') {
              let writer = fs.createWriteStream(dest);
              let reader = d;
              if (typeof d === 'string') {
                reader = fs.createReadStream(d);
              }
              writer.on('error', reject);
              writer.on('finish', () => {resolve(path.join(check.path, check.filename));});
              reader.pipe(writer);
            } else {
              fs.writeFile(dest, d, (err) => err ? reject(err) : resolve(path.join(check.path, check.filename)));
            }
          });
        });
      })
      .then((pth) => { // TODO ОПределять mime-type и content-type
          return dataSource.insert('ion_files', {id: id, path: pth, options: opts, type: resourceType.FILE});
        })
      .then((r) =>
        new StoredFile(
            r.id,
            _options.urlBase + '/' + r.id,
            r.options,
            streamGetter(r)
        )
      );
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return dataSource.get('ion_files', {[F.EQUAL]: ['$id', id]})
      .then((file) => {
        if (file) {
          let result = path.join(_options.storageBase, file.path);
          return new Promise((resolve, reject) => {
            fs.unlink(result, (err) => {
              if (err) {
                return reject(err);
              }
              dataSource.delete('ion_files', {[F.EQUAL]: ['$id', id]}).then(resolve).catch(reject);
            });
          });
        } else {
          return Promise.resolve();
        }
      });
  };

  function streamGetter(file) {
    return function (callback) {
      fs.access(path.join(_options.storageBase, file.path), fs.constants.R_OK, (err) => {
        if (err) {
          return callback(err, null);
        }
        return callback(null, fs.createReadStream(path.join(_options.storageBase, file.path)));
      });
    };
  }

  /**
   * @param {StoredFile} file
   * @returns {Function}
   */
  this._stream = function (file) {
    return streamGetter(file);
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    if (!Array.isArray(ids)) {
      return Promise.resolve([]);
    }
    return dataSource.fetch('ion_files', {filter: {[F.IN]: ['$id', ids]}})
      .then((files) => {
        let result = [];
        for (let i = 0; i < files.length; i++) {
          result.push(
            new StoredFile(
              files[i].id,
              _options.urlBase + '/' + files[i].id,
              files[i].options,
              streamGetter(files[i])
            )
          );
        }
        return result;
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

  function respondDirectory(res, dirName,dirLinks,fileLinks) {
    let html = '<html>' +
      '<head><title>' + xss(dirName) + '</title></head>' +
      '<body><div><h3>' + xss(dirName) + '</h3></div>' +
      '<div>';
    for (let i = 0; i < dirLinks.length; i++) {
      html += '<p><a href="' + dirLinks[i].link + '"><strong>' + xss(dirLinks[i].name) + '&sol;</strong></a></p>';
    }
    html += '</div><div>';
    for (let i = 0; i < fileLinks.length; i++) {
      html += '<p><a href="' + fileLinks[i].link + '">' + xss(fileLinks[i].name) + '</a></p>';
    }
    html += '</div></body></html>';
    res.status(404).send(html);
  }

  function urlAccessor(urlBase, filter) {
    return function (req, res, next) {
      let fileId = req.params.id;

      if (!fileId) {
        return next();
      }

      let f = {[F.EQUAL]: ['$id', fileId]};
      if (filter) {
        f = {[F.AND]: [f, filter]};
      }
      dataSource.get('ion_files', f)
        .then((data) => {
          if (data && data.type === resourceType.FILE) {
            let f = new StoredFile(
              data.id,
              _options.urlBase + '/' + data.id,
              data.options,
              streamGetter(data)
            );
            f.getContents()
              .then(respondFile(req, res))
              .catch(() => {
                res.status(404).send('File not found!');
              });
          } else if (data && data.type === resourceType.DIR) {
            if (data && (data.files.length || data.dirs.length)) {
              let ids = data.files.concat(data.dirs);
              if (Array.isArray(ids)) {
                dataSource.fetch('ion_files', {filter: {[F.IN]: ['$id', ids]}})
                  .then((files) => {
                    let dirLinks = [];
                    let fileLinks = [];
                    for (let i = 0; i < files.length; i++) {
                      if (files[i].type === resourceType.FILE) {
                        fileLinks.push({
                          link: _options.urlBase + '/' + files[i].id,
                          name: files[i].options.name || files[i].id
                        });
                      }
                      if (files[i].type === resourceType.DIR) {
                        dirLinks.push({
                          link: _options.urlBase + '/' + files[i].id,
                          name: files[i].options.name || files[i].id
                        });
                      }
                    }
                    respondDirectory(res, data.name, dirLinks, fileLinks);
                  })
                  .catch(() => {
                    res.status(404).send('File (or directory) not found!');
                  });
              }
            } else {
              res.status(200).send('Folder is empty!');
            }
          } else {
            res.status(404).send('File not found!');
          }
        })
        .catch((err) => {res.status(500).send(err.message);});
    };
  }

  this._shareMiddle = function () {
    return urlAccessor(_options.shareBase, {[F.EQUAL]: ['$shared', true]});
  };

  /**
   * @returns {Function}
   */
  this._fileMiddle = function () {
    return urlAccessor(_options.urlBase);
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return dataSource.ensureIndex('ion_files', {id: 1}, {unique: true})
        .then(() => dataSource.ensureIndex('ion_files', {path: 1}));
  };

  /**
  *
  * @param {String} id
  * @returns {Promise}
  */
  this._getDir = function (id) {
    return dataSource.get('ion_files', {[F.EQUAL]: ['$id', id]})
      .then(function (dir) {
        if (dir && dir.files.length) {
          return _this._fetch(dir.files)
            .then((files) => {
              dir.files = files;
              dir.link = _options.urlBase + '/' + id;
              return dir;
            });
        } else {
          return dir;
        }
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
    let id = cuid();
    let dirObject = {
      id: id,
      type: resourceType.DIR,
      name: name || id,
      files: [],
      dirs: []
    };
    return dataSource.insert('ion_files', dirObject)
      .then((dir) => {
          dir.link = _options.urlBase + '/' + id;
          if (parentDirId) {
            return dataSource.get('ion_files', {[F.EQUAL]: ['$id', parentDirId]})
                .then((parentDir) => {
                  if (parentDir && dir.id) {
                    parentDir.dirs.push(dir.id);
                    return dataSource.update('ion_files', {[F.EQUAL]: ['$id', parentDir.id]}, parentDir)
                      .then(() => fetch ? dir : null);
                  } else {
                    return Promise.reject('нет такой директории');
                  }
                });
          } else {
            return fetch ? dir : null;
          }
        });
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
     */
  this._removeDir = function (id) {
    return dataSource.delete('ion_files', {[F.EQUAL]: ['$id', id]});
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
     */
  this._putFile = function (dirId, fileId) {
    return dataSource.get('ion_files', {[F.EQUAL]: ['$id', dirId]})
      .then((dir) => {
        if (dir) {
          dir.files.push(fileId);
          return dataSource.update('ion_files', {[F.EQUAL]: ['$id', dirId]}, dir).then(() => fileId);
        } else {
          return Promise.reject('Нет такой директории');
        }
      });
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
     */
  this._ejectFile = function (dirId, fileId) {
    return dataSource.get('ion_files', {[F.EQUAL]: ['$id', dirId]})
      .then((dir) => {
        if (dir) {
          let fileIndex = dir.files.indexOf(fileId);
          if (fileIndex > -1) {
            dir.files.splice(fileIndex, 1);
          }
          return dataSource.update('ion_files', {[F.EQUAL]: ['$id', dirId]}, dir).then(() => fileId);
        } else {
          return Promise.reject('Нет такой директории');
        }
      });
  };

  this._share = function (id) {
    return dataSource
      .update('ion_files', {[F.EQUAL]: ['$id', id]}, {shared: true})
      .then(() => _options.shareBase + '/' + id);
  };

  this._currentShare  = function (id) {
    return _options.shareBase + '/' + id;
  };

  this._deleteShare = function (share) {
    let basePath = url.parse(_options.shareBase).path;
    let fileId = share.replace(basePath + '/', '');

    return dataSource
      .update('ion_files', {[F.EQUAL]: ['$id', fileId]}, {shared: false})
      .then(() => true);
  };

  this._fileRoute = function () {
    return _options.urlBase + '/:id';
  };

  this._shareRoute = function () {
    return _options.shareBase + '/:id';
  };
}

FsStorage.prototype = new ResourceStorage();

module.exports = FsStorage;
