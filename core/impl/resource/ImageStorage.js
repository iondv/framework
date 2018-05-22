/**
 * Created by kras on 04.10.16.
 */
'use strict';

const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const gm = require('gm').subClass({imageMagick: true});
const cuid = require('cuid');
const clone = require('clone');
const path = require('path');

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
 * @param {{}} options.thumbnails
 * @param {{}} options.urlBase
 * @param {String} options.thumbsDirectoryMode
 * @param {String} options.thumbsDirectory
 * @constructor
 */
function ImageStorage(options) { // jshint ignore:line

  var fileStorage = options.fileStorage;

  let uploadThumbnails = true;
  if (options.fileStorage.fileOptionsSupport) {
    uploadThumbnails = options.fileStorage.fileOptionsSupport();
  }

  function createThumbnail(source, name, thumbType, opts) {
    let ds = options.thumbnails;
    let format = ds[thumbType].format || 'png';
    let o = clone(opts);
    o.thumbType = thumbType;
    return {
      name: thumbType  + '_' + name.replace(/\.\w+$/, '.' + format),
      stream: gm(source).resize(ds[thumbType].width, ds[thumbType].height).setFormat(format).stream(),
      options: o
    };
  }

  function createThumbnails(source, name, opts) {
    let result = [];
    let ds = options.thumbnails;
    for (let thumb in ds) {
      if (ds.hasOwnProperty(thumb)) {
        result.push(createThumbnail(source, name, thumb, opts));
      }
    }
    return result;
  }

  function streamToBuffer (stream) {
    return new Promise ((resolve, reject) => {
      return gm(stream).quality(100).toBuffer((err, buffer) => {
        if (err) {
          return reject(err);
        }
        return resolve(buffer);
      });
    });
  }

  function getVirtualThumbnails (file) {
    return file.getContents()
      .then((contents) => streamToBuffer(contents.stream))
      .then((buffer) => createThumbnails(buffer, file.name, file.options))
      .then((thumbs) => {
        let result = {};
        thumbs.forEach((t) => {
          result[t.options.thumbType] = new StoredFile(
            t.name,
            `${options.urlBase}/${t.options.thumbType}/${file.id}`,
            t.options,
            function (callback) {
              return callback(null, t.stream);
            }
          );
        });
        return result;
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

    if (uploadThumbnails) {
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
        .then((source) => createThumbnails(source, opts.name || data.originalname || data.name || cuid(), opts))
        .then((thumbs) => {
          let thumbDirectory =  null;
          switch (options.thumbsDirectoryMode) {
            case thumbsDirectoryModes.RELATIVE: {
              thumbDirectory = path.join(directory || "", options.thumbsDirectory || "");
            } break;
            case thumbsDirectoryModes.ABSOLUTE: {
              thumbDirectory = options.thumbsDirectory;
            } break;
          }
          let tp = Promise.resolve();
          let th_ids = {};
          thumbs.forEach((t) => {
            tp = tp.then(() => options.fileStorage.accept(
              {name: t.name, stream: t.stream},
              thumbDirectory,
              t.options
            ))
            .then((thf) => {
              thumbnails[thf.options.thumbType] = thf;
              th_ids[thf.options.thumbType] = thf.id;
            });
          });
          return tp.then(() => th_ids);
        });
    }

    p = p.then((thumbnails_ids) => {
      let o = clone(opts);
      if (thumbnails_ids) {
        o.thumbnails = thumbnails_ids;
      }
      return fileStorage.accept(data, directory, o);
    });

    if (!uploadThumbnails) {
      p = p.then((file) => {
        return getVirtualThumbnails(file)
          .then((thumbs) => {
            thumbnails = thumbs;
            return file;
          });
        });
    }

    return p.then((file) => new StoredImage(file, thumbnails));
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return fileStorage.fetch([id])
      .then(
        /**
         * @param {StoredFile[]} files
         */
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
      )
      .then(() => fileStorage.remove(id));
  };

  function thumbsLoader(files) {
    let thumbs = [];
    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file.options.thumbnails) {
          Object.keys(file.options.thumbnails).forEach((t) => thumbs.push(file.options.thumbnails[t]));
        }
      });
    }
    let tmp = files;
    return fileStorage.fetch(thumbs)
      .then((thumbnails) => {
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
            result.push(new StoredImage(tmp[i], thumbs));
          } else {
            result.push(tmp[i]);
          }
        }
        return result;
      });
  }

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return fileStorage.fetch(ids)
      .then((files) => {
        if (!uploadThumbnails) {
          let p = Promise.resolve();
          let images = [];
          files.forEach((file) => {
            p = p.then(() => getVirtualThumbnails(file))
              .then((thumbnails) => images.push(new StoredImage(file, thumbnails)));
          });
          return p.then(() => images);
        }
        return thumbsLoader(files);
      });
  };

  /**
   * @returns {Function}
   */
  this._fileMiddle = function () {
    return function (req, res, next) {
      let ds = options.thumbnails;
      let thumbType = ds && Object.keys(ds).indexOf(req.params.thumb) > -1 ? req.params.thumb : null;
      let imageId = req.params.id;

      if (!thumbType || !imageId) {
        return next();
      }

      return fileStorage.fetch([imageId])
        .then((images) => {
          if (!images[0]) {
            throw new Error('Image not found!');
          }

          if (uploadThumbnails) {
            let thumbId = images[0].options.thumbnails[thumbType];
            if (thumbId) {
              return fileStorage.fetch([thumbId])
                .then((thumbs) => {
                  if (!thumbs[0]) {
                    throw new Error('Thumbnail not found!');
                  }
                  return thumbs[0].getContents();
                });
            }
            throw new Error('The image does not have a thumbnail!');
          } else {
            return images[0].getContents()
              .then((contents) => createThumbnail(contents.stream, path.basename(imageId), thumbType, contents.options));
          }
        })
        .then((thumb) => {
          if (thumb && thumb.stream) {
            let o = thumb.options || {};
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
            thumb.stream.pipe(res);
          } else {
            res.status(404).send('Thumbnail not found!');
          }
        })
        .catch((err) => res.status(500).send(err.message));
    };
  };

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

  this._fileRoute = function () {
    return options.urlBase + '/:thumb/:id(([^/]+/?[^/]+)*)';
  };
}

ImageStorage.prototype = new ResourceStorage();

module.exports = ImageStorage;
module.exports.StoredImage = StoredImage;
