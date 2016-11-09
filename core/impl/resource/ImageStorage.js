/**
 * Created by kras on 04.10.16.
 */
'use strict';

const ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
const gm = require('gm');
const cuid = require('cuid');
const clone = require('clone');

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
 * @constructor
 */
function ImageStorage(options) {

  function createThumbnails(source, name, opts) {
    var result = [];
    var ds = options.thumbnails;
    var format;
    for (var thumb in ds) {
      if (ds.hasOwnProperty(thumb)) {
        format = ds[thumb].format || 'png';
        opts.thumbType = thumb;
        opts.name = thumb  + '_' + name.replace(/\.\w+$/, '.' + format);
        result.push(
          options.fileStorage.accept(
            gm(source).
            resize(ds[thumb].width, ds[thumb].height).
            setFormat(format).
            stream(),
            opts
          )
        );
      }
    }
    return Promise.all(result);
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [opts]
   * @returns {Promise}
   */
  this._accept = function (data, opts) {
    return new Promise(function (resolve, reject) {
      var ops = opts || {};
      var o = clone(ops);
      var thumbs, name, thumbnails;
      var mime = ops.mimetype || ops.mimeType || data.mimetype || data.mimeType;

      if (mime && mime.indexOf('image/') !== 0) {
        return reject(new Error('Переданные данные не являются изображением!'));
      }

      if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
        name = ops.name || data.originalname || data.name || cuid();
        if (typeof data.buffer !== 'undefined') {
          thumbs = createThumbnails(data.buffer, name, o);
        } else if (typeof data.path !== 'undefined') {
          thumbs = createThumbnails(data.path, name, o);
        }
      } else {
        name = ops.name || cuid();
        thumbs = createThumbnails(data, name, o);
      }

      thumbs.then(function (files) {
        thumbnails = {};
        ops.thumbnails = {};
        for (var i = 0; i < files.length; i++) {
          thumbnails[files[i].options.thumbType] = files[i];
          ops.thumbnails[files[i].options.thumbType] = files[i].id;
        }
        return options.fileStorage.accept(data, ops);
      }).then(
        /**
         * @param {StoredFile} file
         */
        function (file) {
          resolve(new StoredImage(file.id, file.link, thumbnails, file.options));
        }
      ).catch(reject);
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

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    var tmp;
    return new Promise(function (resolve, reject) {
      options.fileStorage.fetch(ids).
      then(
        function (files) {
          var thumbs = [];
          var thumb;

          for (var i = 0; i < files.length; i++) {
            if (files[i].options.thumbnails) {
              for (thumb in files[i].options.thumbnails) {
                if (files[i].options.thumbnails.hasOwnProperty(thumb)) {
                  thumbs.push(files[i].options.thumbnails[thumb]);
                }
              }
            }
          }
          tmp = files;
          return options.fileStorage.fetch(thumbs);
        }
      ).
      then(
        function (thumbnails) {
          var i, thumbs, thumb;
          var thumbById = {};
          var result = [];
          for (i = 0; i < thumbnails.length; i++) {
            thumbById[thumbnails[i].id] = thumbnails[i];
          }
          for (i = 0; i < tmp.length; i++) {
            if (tmp[i].options.thumbnails) {
              thumbs = {};
              for (thumb in tmp[i].options.thumbnails) {
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
          resolve(result);
        }
      ).
      catch(reject);
    });
  };
}

ImageStorage.prototype = new ResourceStorage();

module.exports = ImageStorage;
module.exports.StoredImage = StoredImage;
