/**
 * Created by kras on 04.10.16.
 */
'use strict';

const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const gm = require('gm');
const cuid = require('cuid');
const clone = require('clone');
const url = require('url');
const path = require('path');

// jshint maxcomplexity: 20

/**
 * @param {String} id
 * @param {String} link
 * @param {StoredImage[]} thumbnails
 * @param {{}} [options]
 * @param {Function} [streamGetter]
 * @constructor
 */
function StoredImage(id, link, thumbnails, options, streamGetter) {
  StoredFile.apply(this, [id, link, options, streamGetter]);
  this.thumbnails = thumbnails;
}

/**
 * @param {{}} options
 * @param {ResourceStorage} options.fileStorage
 * @param {{}} options.thumbnails
 * @param {{}} options.urlBase
 * @constructor
 */
function ImageStorage(options) {

  let uploadThumbnails = options.fileStorage.fileOptions && options.fileStorage.fileOptions() || true;

  function createThumbnails(source, name, opts) {
    var result = [];
    var ds = options.thumbnails;
    var format;
    for (var thumb in ds) {
      if (ds.hasOwnProperty(thumb)) {
        format = ds[thumb].format || 'png';
        opts.thumbType = thumb;
        result.push(
          options.fileStorage.accept(
            {name: thumb  + '_' + name.replace(/\.\w+$/, '.' + format),
              stream: gm(source)
              .resize(ds[thumb].width, ds[thumb].height)
              .setFormat(format)
              .stream()},
            null,
            opts
          )
        );
      }
    }
    return Promise.all(result);
  }

  function imageToBuffer(source) {
    return new Promise (function (resolve, reject) {
      gm(source).quality(100).toBuffer(function (err, buf) {
        if (err) {
          return reject(err);
        }
        return resolve(buf);
      });
    });
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} [directory]
   * @param {{}} [opts]
   * @returns {Promise}
   */
  this._accept = function (data, directory, opts) {
    return new Promise(function (resolve, reject) { // jshint ignore:line
      let ops = opts || {};
      let o = clone(ops);
      let thumbs, name, thumbnails;
      let mime = ops.mimetype || ops.mimeType || data.mimetype || data.mimeType;

      if (mime && mime.indexOf('image/') !== 0) {
        return reject(new Error('Переданные данные не являются изображением!'));
      }

      if (uploadThumbnails) {
        if (typeof data === 'object' &&
          (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
          name = ops.name || data.originalname || data.name || cuid();
          if (typeof data.buffer !== 'undefined') {
            thumbs = createThumbnails(data.buffer, name, o);
          } else if (typeof data.path !== 'undefined') {
            thumbs = createThumbnails(data.path, name, o);
          } else if (typeof data.stream !== 'undefined') {
            thumbs = imageToBuffer(data.stream)
              .then(buffer => {
                delete data.stream;
                data.buffer = buffer;
                return createThumbnails(data.buffer, name, o);
              });
          }
        } else {
          name = ops.name || cuid();
          thumbs = createThumbnails(data, name, o);
        }

        if (!thumbs) {
          return reject(new Error('Переданные не корректные данные!'));
        }
      }

      if (!thumbs) {
        thumbs = Promise.resolve(null);
      }

      thumbs
        .then((files) => {
          if (files) {
            thumbnails = {};
            ops.thumbnails = {};
            for (let i = 0; i < files.length; i++) {
              thumbnails[files[i].options.thumbType] = files[i];
              ops.thumbnails[files[i].options.thumbType] = files[i].id;
            }
          }
          return options.fileStorage.accept(data, directory, ops);
        })
        .then((file) => resolve(new StoredImage(file.id, file.link, thumbnails, file.options)))
        .catch(reject);
    });
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return new Promise(function (resolve, reject) {
      options.fileStorage.fetch([id]).
      then(
        /**
         * @param {StoredFile[]} files
         */
        function (files) {
          var thumbs = [];
          var thumb;
          for (var i = 0; i < files.length; i++) {
            if (files[i].options.thumbnails) {
              for (thumb in files[i].options.thumbnails) {
                if (files[i].options.thumbnails.hasOwnProperty(thumb)) {
                  thumbs.push(options.fileStorage.remove(files[i].options.thumbnails[thumb]));
                }
              }
            }
          }
          return Promise.all(thumbs);
        }
      ).
      then(
        function () {
          return options.fileStorage.remove(id);
        }
      ).
      then(resolve).
      catch(reject);
    });
  };

  function thumbsLoader(files) {
    let thumbs = [];
    if (Array.isArray(files)) {
      files.forEach(file => {
        if (file.options.thumbnails) {
          Object.keys(file.options.thumbnails).forEach(t => thumbs.push(file.options.thumbnails[t]));
        }
      });
    }
    let tmp = files;
    return options.fileStorage.fetch(thumbs)
      .then(thumbnails => {
        let thumbById = {};
        let result = [];
        for (let i = 0; i < thumbnails.length; i++) {
          thumbById[thumbnails[i].id] = thumbnails[i];
        }
        for (let i = 0; i < tmp.length; i++) {
          if (tmp[i].options.thumbnails) {
            let thumbs = {};
            for (let thumb in tmp[i].options.thumbnails) {
              if (
                tmp[i].options.thumbnails.hasOwnProperty(thumb) &&
                thumbById.hasOwnProperty(tmp[i].options.thumbnails[thumb])
              ) {
                thumbs[thumb] = thumbById[tmp[i].options.thumbnails[thumb]];
              }
            }
            result.push(new StoredImage(tmp[i].id, tmp[i].link, thumbs, tmp[i].options));
          } else {
            result.push(tmp[i]);
          }
        }
        return result;
      });
  }

  function slashChecker(path) {
    if (path && path.slice(0) !== '/') {
      return '/' + path;
    }
    return path || '';
  }

  function thumbsStreamer(files) {
    if (!Array.isArray(files)) {
      return files;
    }
    let result = [];
    files.forEach(file => {
      let thumbs = {};
      if (options.thumbnails) {
        Object.keys(options.thumbnails).forEach(thumb => {
          thumbs[thumb] = new StoredFile(
            file.id,
            slashChecker(`${options.urlBase}/${thumb}/${file.id}`),
            file.options,
            null
          );
        });
      }
      result.push(new StoredImage(file.id, file.link, thumbs, file.options));
    });
    return result;
  }

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return new Promise(function (resolve, reject) {
      options.fileStorage.fetch(ids)
        .then(files => {
          if (!uploadThumbnails) {
            return thumbsStreamer(files);
          }
          return thumbsLoader(files);
        })
        .then(resolve)
        .catch(reject);
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
      try {
        if (uploadThumbnails) {
          return next();
        }
        let basePath = url.parse(options.urlBase).path;
        if (req.path.indexOf(basePath) !== 0) {
          return next();
        }

        let mapping = req.path.replace(basePath + '/', '');
        if (!mapping) {
          return next();
        }

        let ds = options.thumbnails;
        let mapParts = mapping.split('/');
        let thumbType, imageId;
        if (mapParts.length > 1) {
          thumbType = ds && Object.keys(ds).indexOf(mapParts[0]) > -1 ? mapParts[0] : null;
          imageId = mapParts.slice(1).join('/');
        }
        if (!thumbType || !imageId) {
          return next();
        }

        options.fileStorage.fetch([imageId])
          .then(images => {
            if (!images[0]) {
              throw new Error('File not found!');
            }
            return images[0].getContents();
          })
          .then(image => {
            if (!image || !image.stream) {
              throw new Error('File not found!');
            }
            let format = ds[thumbType].format || 'png';
            let name = path.basename(imageId);
            name = thumbType + '_' + name.replace(/\.\w+$/, '.' + format);
            let stream = gm(image.stream).resize(ds[thumbType].width, ds[thumbType].height).setFormat(format).stream();
            return {name, stream, options: image.options};
          })
          .then(respondFile(req, res))
          .catch(err => res.status(500).send(err.message));
      } catch (err) {
        return next();
      }
    };
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getDir = function (id) {
    return options.fileStorage.getDir(id);
  };

  /**
   *
   * @param {String} name
   * @param {String} parentDirId
   * @param {Boolean} fetch
   * @returns {Promise}
   */
  this._createDir = function (name, parentDirId, fetch) {
    return options.fileStorage.createDir(name, parentDirId, fetch);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._removeDir = function (id) {
    return options.fileStorage.removeDir(id);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._putFile = function (dirId, fileId) {
    return options.fileStorage.putFile(dirId, fileId);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._ejectFile = function (dirId, fileId) {
    return options.fileStorage.ejectFile(dirId, fileId);
  };

  this._share = function (id) {
    return options.fileStorage.share(id);
  };

  this._currentShare = function (id) {
    return options.fileStorage.currentShare(id);
  };
}

ImageStorage.prototype = new ResourceStorage();

module.exports = ImageStorage;
module.exports.StoredImage = StoredImage;
