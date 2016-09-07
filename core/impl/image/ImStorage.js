/**
 * Created by kalias_90 on 06.09.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
var gm = require('gm');

function ImStorage(options) {
  var _this = this;

  var fs = options.fileStorage;

  if (!fs) {
    throw new Error('Не указано файловое хранилище!');
  }

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    return _this.fs.accept(data, options);
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
