/**
 * Created by kalias_90 on 06.09.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
var gm = require('gm').subClass({imageMagick: true});
var cuid = require('cuid');
var clone = require('clone');
var fs = require('fs');
var streamBuffers = require('stream-buffers');

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

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    var opts = clone(options) || {};
    var orig;
    var fn = null;
    var thumbs = [];

    if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
      fn = opts.name || data.originalname || data.name;
      if (typeof data.buffer !== 'undefined') {
        orig = new streamBuffers.ReadableStreamBuffer();
        orig.put(data.buffer);
      } else if (typeof data.path !== 'undefined') {
        orig = fs.createReadStream(data.path);
      }
    } else {
      fn = opts.name;
      if (typeof data === 'string') {
        orig = fs.createReadStream(data);
      } else if (Buffer.isBuffer(data)) {
        orig = new streamBuffers.ReadableStreamBuffer();
        orig.put(data);
      } else if (typeof data.pipe === 'function') {
        orig = data;
      }
    }
    if (typeof orig.pipe !== 'function') {
      throw new Error('Не удалось преобразовать переданные данные в поток!');
    }
    if (!fn) {
      fn = cuid();
      opts.name = fn;
    }
    fn = fn.split('.');

    for (var i in _this.ds) {
      if (_this.ds.hasOwnProperty(i)) {
        var thumbOpts = clone(opts);
        thumbOpts.name = fn[0] + '_' + i + (fn.length > 1 ? '.' + fn[1] : '');
        // TODO: Файлы пустые!
        var thumbnailStream = gm(orig).resize(_this.ds[i].width, _this.ds[i].height).stream();
        thumbs[thumbs.length] = _this.fs.accept(thumbnailStream, thumbOpts);
      }
    }

    return Promise.all(thumbs).then(function (thumbnails) {
      // TODO: В миниатюры объекта нужно както их раскидать по форматам
      opts.thumbnails = thumbnails;
      return _this.fs.accept(data, opts);
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
    return _this.fs.fetch(ids);
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
