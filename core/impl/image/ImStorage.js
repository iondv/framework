/**
 * Created by kalias_90 on 06.09.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
var StoredImage = require('./StoredImage');
var gm = require('gm');
var clone = require('clone');
var cuid = require('cuid');

function ImStorage(options) {
  var _this = this;

  _this.fs = options.fileStorage;
  _this.ds = options.dimensionsSet;

  if (!_this.fs) {
    throw new Error('Не указано файловое хранилище!');
  }
  if (!_this.ds) {
    throw new Error('Не указаны размеры миниатюр!');
  }

  function createThumbnails(source, name, options) {
    var result = [];
    for (var i in _this.ds) {
      if (_this.ds.hasOwnProperty(i)) {
        options.size = i;
        options.name = name.replace('.', '_' + i + '.');
        result[result.length] = _this.fs.accept(
          gm(source).resize(_this.ds[i].width, _this.ds[i].height).stream(),
          options);
      }
    }
    return result;
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    var opts = clone(options) || {};
    var o = clone(options) || {};
    var thumbs = [];
    var name;

    if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
      name = opts.name || data.originalname || data.name || cuid();
      if (typeof data.buffer !== 'undefined') {
        thumbs = createThumbnails(data.buffer, name, o);
      } else if (typeof data.path !== 'undefined') {
        thumbs = createThumbnails(data.path, name, o);
      }
    } else {
      name = opts.name || cuid();
      thumbs = createThumbnails(data, name, o);
    }

    return Promise.all(thumbs).then(function (thumbnails) {
      opts.thumbnails = {};
      for (var i = 0; i < thumbnails.length; i++) {
        opts.thumbnails[thumbnails[i].options.size] = thumbnails[i].id;
      }
      return _this.fs.accept(data, opts).then(function (r) {
        return new StoredImage(r, thumbnails);
      });
    });
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return _this.fs.remove(id);
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return _this.fs.fetch(ids).then(function (files) {
      var thumbIds = [];
      for (var i = 0; i < files.length; i++) {
        for (var j in files[i].options.thumbnails) {
          if (files[i].options.thumbnails.hasOwnProperty(j)) {
            thumbIds[thumbIds.length] = files[i].options.thumbnails[j];
          }
        }
      }
      return _this.fs.fetch(thumbIds).then(function (thumbs) {
        var result = [];
        for (var i = 0; i < files.length; i++) {
          var t = [];
          for (var j in files[i].options.thumbnails) {
            if (files[i].options.thumbnails.hasOwnProperty(j)) {
              for (var q = 0; q < thumbs.length; q++) {
                if (thumbs[q].id === files[i].options.thumbnails[j]) {
                  t[t.length] = thumbs[q];
                }
              }
            }
          }
          result[result.length] = new StoredImage(files[i], t);
        }
        return result;
      });
    });
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return _this.fs.middle();
  };
}

ImStorage.prototype = new ResourceStorage();

module.exports = ImStorage;
