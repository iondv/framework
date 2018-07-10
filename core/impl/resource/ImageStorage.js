/* eslint no-invalid-this:off */
/**
 * Created by kras on 04.10.16.
 */
'use strict';

const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const sharp = require('sharp');
const canvas = require('canvas-prebuilt');
const cuid = require('cuid');
const clone = require('clone');
const path = require('path');
const system = require('core/system');
const {watermarkPipe} = require('core/util/watermark-overlay');

const thumbsDirectoryModes = {
  IGNORE: 'ignore',
  RELATIVE: 'relative',
  ABSOLUTE: 'absolute'
};

// jshint maxcomplexity: 20

/**
 * @param {StoredFile} file
 * @param {{}} thumbnails
 * @constructor
 */
function StoredImage (file, thumbnails) {
  StoredFile.apply(this, [file.id, file.link, file.options]);
  this.file = file;
  this.thumbnails = thumbnails;

  this.getContents = function() {
    return this.file.getContents();
  };
}

StoredImage.prototype = Object.create(StoredFile.prototype);
StoredImage.prototype.constructor = StoredImage;

/**
 * @param {{}} options
 * @param {ResourceStorage} options.fileStorage
 * @param {{}} options.app
 * @param {Auth} options.auth
 * @param {{}} options.thumbnails
 * @param {{}} options.urlBase
 * @param {Boolean} options.storeThumbnails
 * @param {String} [options.thumbsDirectoryMode]
 * @param {String} [options.thumbsDirectory]
 * @param {Logger} [options.log]
 * @constructor
 */
function ImageStorage(options) { // jshint ignore:line

  var fileStorage = options.fileStorage;

  let storeThumbnails = (options.storeThumbnails !== false);
  if (typeof options.fileStorage.fileOptionsSupport === 'function') {
    storeThumbnails = storeThumbnails && options.fileStorage.fileOptionsSupport();
  }

  function thumbnail(source, opts) {
    let format = opts.format || 'png';
    return sharp(source).resize(opts.width, opts.height).max().toFormat(format);
  }

  function streamToBuffer(stream) {
    return new Promise ((resolve, reject) => {
      let bufs = [];
      stream.on('data', d => bufs.push(d));
      stream.on('end', () => resolve(Buffer.concat(bufs)));
      stream.on('error', e => reject(e));
    });
  }

  /**
   * @param {StoredFile} file
   * @param {{}} thumbnails
   * @returns {*}
   */
  function setThumbnails(file, thumbnails) {
    Object.keys(options.thumbnails).forEach((thumb) => {
      let o = clone(file.options);
      o.thumbType = thumb;

      thumbnails[thumb] = new StoredFile(
        file.id + '_' + thumb,
        `${options.urlBase}/${thumb}/${file.id}`,
        o,
        (callback) => {
          if (file.buffer) {
            callback(null, thumbnail(file.buffer, options.thumbnails[thumb]));
          } else {
            if (file.loading) {
              file.onloaded.push(() => {
                callback(null, thumbnail(file.buffer, options.thumbnails[thumb]));
              });
            } else {
              file.loading = true;
              file.onloaded = [];
              file.getContents()
                .then(f => streamToBuffer(f.stream))
                .then((buff) => {
                  file.buffer = buff;
                  file.loading = false;
                  file.onloaded.forEach(f => f());
                  callback(null, thumbnail(file.buffer, options.thumbnails[thumb]));
                })
                .catch(e => callback(e));
            }
          }
        }
      );
    });
  }

  /**
   * @param {StoredFile} file
   * @param {{}} thumbnails
   * @returns {*}
   */
  function loadThumbnails(file, thumbnails) {
    Object.keys(file.options.thumbnails).forEach((thumb) => {
      let o = clone(file.options);
      delete o.thumbnails;
      o.thumbType = thumb;
      let format = options.thumbnails[thumb].format || 'png';
      o.name = thumb + '_' + o.name.replace(/\.\w+$/, '.' + format);
      o.mimeType = 'image/' + format;

      thumbnails[thumb] = new StoredFile(
        file.options.thumbnails[thumb],
        `${options.urlBase}/${thumb}/${file.id}`,
        o,
        (callback) => {
          fileStorage.fetch([file.options.thumbnails[thumb]])
            .then((f) => {
              if (!f.length) {
                throw new Error('Thumbnail not found!');
              }
              return f[0].getContents();
            })
            .then(c => callback(null, c.stream))
            .catch(e => callback(e));
        }
      );
    });
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {String} [directory]
   * @param {{}} [opts]
   * @returns {Promise}
   */
  this._accept = function (data, directory, opts = {}) {
    let thumbnails = {};
    let mime = opts.mimetype || opts.mimeType || data.mimetype || data.mimeType;

    if (mime && mime.indexOf('image/') !== 0) {
      return Promise.reject(new Error('Переданные данные не являются изображением!'));
    }

    let p = Promise.resolve();

    if (storeThumbnails && options.thumbnails) {
      p = p.then(() => {
          if (typeof data === 'object') {
            if (!Buffer.isBuffer(data) && typeof data.buffer !== 'undefined') {
              return data.buffer;
            } else if (typeof data.path !== 'undefined') {
              return data.path;
            } else if (typeof data.stream !== 'undefined') {
              return streamToBuffer(data.stream)
                .then((buffer) => {
                  delete data.stream;
                  data.buffer = buffer;
                  return data.buffer;
                });
            }
          }
          return data;
        })
        .then((source) => {
          let thumbDirectory;
          switch (options.thumbsDirectoryMode) {
            case thumbsDirectoryModes.RELATIVE:
              thumbDirectory = path.join(directory || '', options.thumbsDirectory || '');
              break;
            case thumbsDirectoryModes.ABSOLUTE:
              thumbDirectory = options.thumbsDirectory || null;
              break;
            default:
              thumbDirectory = null;
              break;
          }
          let tp = Promise.resolve();
          let th_ids = {};

          let nm = opts.name || data.originalname || data.name || cuid();

          Object.keys(options.thumbnails).forEach((thumb) => {
            let format = options.thumbnails[thumb].format || 'png';
            let o = clone(opts);
            o.thumbType = thumb;
            o.mimeType = 'image/' + format;

            tp = tp
              .then(
                () => options.fileStorage.accept(
                  {
                    name: thumb + '_' + nm.replace(/\.\w+$/, '.' + format),
                    stream: thumbnail(source, options.thumbnails[thumb])
                  },
                  thumbDirectory,
                  o)
              )
              .then(
                (thf) => {
                  thumbnails[thumb] = thf;
                  th_ids[thumb] = thf.id;
                }
              );
          });
          return tp.then(() => th_ids);
        });
    }

    return p.then((thumbnails_ids) => {
      let o = clone(opts);
      if (thumbnails_ids) {
        o.thumbnails = thumbnails_ids;
      }
      return fileStorage.accept(data, directory, o);
    }).then((file) => {
      if (!storeThumbnails) {
        setThumbnails(file, thumbnails);
        file = file.clone();
      } else {
        for (let thumb in thumbnails) {
          if (thumbnails.hasOwnProperty(thumb)) {
            thumbnails[thumb].link = `${options.urlBase}/${thumb}/${file.id}`;
          }
        }
      }
      return new StoredImage(file, thumbnails);
    });
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    let p = Promise.resolve();
    if (storeThumbnails) {
      p = p.then(() => fileStorage.fetch([id])
        .then(
          (files) => {
            let thumbs = Promise.resolve();
            files.forEach((f) => {
              if (f.options.thumbnails) {
                Object.keys(f.options.thumbnails).forEach((thumb) => {
                  thumbs = thumbs.then(() => fileStorage.remove(f.options.thumbnails[thumb]));
                });
              }
            });
            return thumbs;
          }
        ));
    }
    return p.then(() => fileStorage.remove(id));
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return fileStorage.fetch(ids)
      .then((files) => {
        let images = [];
        files.forEach((file) => {
          let thumbnails = {};
          if (storeThumbnails && file.options && file.options.thumbnails) {
            loadThumbnails(file, thumbnails);
          } else {
            setThumbnails(file, thumbnails);
            file = file.clone();
          }
          images.push(new StoredImage(file, thumbnails));
        });
        return images;
      });
  };

  function fileMiddle() {
    return function (req, res) {
      let thumbType = (options.thumbnails && options.thumbnails[req.params.thumb] && req.params.thumb) || null;
      let imageId = req.params.id;

      if (!thumbType || !imageId) {
        return res.status(404).send('Thumbnail not found!');
      }

      return this.fetch([imageId])
        .then((images) => {
          if (!images[0]) {
            throw new Error('Image not found!');
          }
          let thumb = images[0].thumbnails && images[0].thumbnails[thumbType];
          if (thumb) {
            let o = thumb.options || {};
            return thumb.getContents()
              .then((c) => {
                const condition = true;
                if (condition) {
                  const {width, height} = options.thumbnails[thumbType];
                  return watermarkPipe(c.stream, {text: 'Hello world', width, height});
                }
                return c.stream;
              })
              .then((stream) => {
                res.status(200);
                res.set('Content-Disposition',
                  (req.query.dwnld ? 'attachment' : 'inline') + '; filename="' + encodeURIComponent(thumb.name) +
                  '";filename*=UTF-8\'\'' + encodeURIComponent(thumb.name));
                res.set('Content-Type', o.mimetype || 'application/octet-stream');
                if (o.size) {
                  res.set('Content-Length', o.size);
                }
                if (o.encoding) {
                  res.set('Content-Encoding', o.encoding);
                }
                stream.on('error', (err) => {
                  if (options.log) {
                    options.log.error(err);
                  }
                  res.status(404).send('Thumbnail not found!');
                });
                stream.pipe(res);
              });
          } else {
            res.status(404).send('Thumbnail not found!');
          }
        })
        .catch((err) => {
          if (options.log) {
            options.log.error(err);
          }
          res.status(500).send(err.message || err);
        });
    }.bind(this);
  }

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getDir = function (id) {
    return fileStorage.getDir(id);
  };

  /**
   *
   * @param {String} name
   * @param {String} parentDirId
   * @param {Boolean} fetch
   * @returns {Promise}
   */
  this._createDir = function (name, parentDirId, fetch) {
    return fileStorage.createDir(name, parentDirId, fetch);
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._removeDir = function (id) {
    return fileStorage.removeDir(id);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._putFile = function (dirId, fileId) {
    return fileStorage.putFile(dirId, fileId);
  };

  /**
   *
   * @param {String} dirId
   * @param {String} fileId
   * @returns {Promise}
   */
  this._ejectFile = function (dirId, fileId) {
    return fileStorage.ejectFile(dirId, fileId);
  };

  this._share = function (id) {
    return fileStorage.share(id);
  };

  this._currentShare = function (id) {
    return fileStorage.currentShare(id);
  };

  /**
   * @param {ResourceStorage} storage
   */
  this.setFileStorage = function (storage) {
    fileStorage = storage;
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    if (options.app && options.auth && options.urlBase) {
      options.app.get(options.urlBase + '/:thumb/:id(([^/]+/?[^/]+)*)', options.auth.verifier(), fileMiddle.apply(this));
    }
    return Promise.resolve();
  };
}

ImageStorage.prototype = new ResourceStorage();

module.exports = ImageStorage;
module.exports.StoredImage = StoredImage;
