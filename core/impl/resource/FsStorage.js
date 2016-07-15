/**
 * Created by kras on 14.07.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage');
var moment = require('moment');
var fs = require('fs');
var path = require('path');

function FsStorage(options) {

  /**
   * @type {DataSource}
   */
  var dataSource = null;

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    return new Promise(function (resolve, reject) {
      dataSource.insert('ion_files', {}).then(function (r) {
        fs.writeFile(path.join(options.storagePath, r.path), data, {},
          function (err) {
            if (err) {
              reject(err);
            }
            resolve(r._id.toString());
          }
        );
      }).catch(reject);
    });
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._data = function (ids) {

    return new Promise(function (resolve) {resolve();});
  };

  /**
   * @param {String} uid
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._resourceLinks = function (uid, ids) {
    return new Promise(function (resolve) {resolve();});
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return function (req, res, next) {
      next();
    };
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    if (options.DataSource.constructor.prototype.constructor.name === 'DataSource') {
      dataSource = options.DataSource;
    }

    dataSource = global.ionDatasources.get(options.dataSource);

    if (!dataSource) {
      throw new Error('Не указан источник данных файлового хранилища!');
    }

    return new Promise(function (resolve, reject) {
      dataSource.ensureIndex('ion_files', {path: 1}).then(function () {resolve();}).catch(reject);
    });
  };
}

FsStorage.prototype = new ResourceStorage();

module.exports = FsStorage;
