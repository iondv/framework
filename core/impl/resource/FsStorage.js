/**
 * Created by kras on 14.07.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var cuid = require('cuid');
var merge = require('merge');
var clone = require('clone');

/* jshint maxcomplexity: 20 */
/**
 * @param {{storageBase: String, urlBase: String, dataSource: DataSource, fragmentation: String}} options
 * @constructor
 */
function FsStorage(options) {
  var _this = this;

  /**
   * @type {DataSource}
   */
  var dataSource = options.dataSource;
  if (!dataSource) {
    throw new Error('Не указан источник данных файлового хранилища!');
  }

  delete options.dataSource;
  var _options = clone(options) || {};

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    var opts = clone(options) || {};
    var m = moment();
    var pth = m.format('YYYY' + path.delimiter + 'MM' + path.delimiter + 'DD');
    switch (_options.fragmentation) {
      case 'hour':pth = path.join(pth, m.format('HH'));break;
      case 'minute':pth = path.join(pth, m.format('mm'));break;
    }

    var d;
    var fn;

    if (typeof data === 'object' && typeof data.originalname !== 'undefined') {
      fn = opts.name || data.originalname || cuid();
      if (typeof data.buffer !== 'undefined') {
        d = data.buffer;
      } else if (typeof data.path !== 'undefined') {
        d = data.path;
      }

      var dt = clone(data);
      delete dt.buffer;
      delete dt.path;

      opts = merge(opts, dt);
    } else if (typeof data === 'string' || Buffer.isBuffer(data) || typeof data.pipe === 'function') {
      d = data;
      fn = opts.name || cuid();
    } else {
      throw new Error('Переданы данные недопустимого типа!');
    }

    function checkDest(filename) {
      return new Promise(function (resolve, reject) {
        var result = path.join(_options.storageBase, pth, filename);
        fs.stat(result, function (err, stats) {
          if (err) {
            return reject(err);
          }

          if (stats && stats.isFile()) {
            checkDest(cuid()).then(resolve).catch(reject);
            return;
          }

          resolve({dest: result, path: path.join(pth, filename)});
        });
      });
    }

    return new Promise(function (resolve, reject) {
      checkDest(fn).
      then(function (check) {
        return new Promise(function (rs, rj) {
          if (typeof d === 'string' || typeof d.pipe === 'function') {
            var writer, reader;
            writer = fs.createWriteStream(check.dest, opts);
            reader = d;
            if (typeof d === 'string') {
              reader = fs.createReadStream(d, opts);
            }
            writer.on('error', rj);
            writer.on('finish', function () {
              rs(check.path); // TODO Фиксировать размер файла
            });
            reader.pipe(writer);
          } else {
            fs.writeFile(check.dest, d, opts, function (err) {
              if (err) {
                rj(err);
              }
              rs(check.path);
            });
          }
        });
      }).then(function (pth) { // TODO ОПределять mime-type и content-type
        return dataSource.insert('ion_files', {path: pth, options: opts});
      }).then(function (r) {
        resolve(r._id.toString());
      }).catch(reject);
    });
  };

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._data = function (ids) {
    return new Promise(function (resolve, reject) {
      dataSource.fetch('ion_files', {_id: {$in: ids}}).
      then(function (files) {
        var result = [];
        for (var i = 0; i < files.length; i++) {
          result.push(
            {
              stream: fs.createReadStream(path.join(_options.storageBase, files[i].path), files[i].options),
              options: files[i].options
            }
          );
        }
        resolve(result);
      }).
      catch(reject);
    });
  };

  /**
   * @param {String} uid
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._resourceLinks = function (uid, ids) {
    return new Promise(function (resolve, reject) {
      dataSource.fetch('ion_files', {_id: {$in: ids}}).
      then(function (files) {
        var result = [];
        for (var i = 0; i < files.length; i++) {
          result.push(_options.urlBase + '/' + files[i]._id.toString());
        }
        resolve(result);
      }).
      catch(reject);
    });
  };

  /**
   * @returns {Function}
   */
  this._middle = function () {
    return function (req, res, next) {
      if (req.params.fileId) {
        _this._data([req.params.fileId])
          .then(
            function (data) {
              if (data.length > 0) {
                res.state(200); // TODO set headers for file based on options
                data[0].stream.pipe(res);
                return;
              }
              res.state(404).send('File not found!');
            }
          )
          .catch(
            function (err) {
              res.state(500).send(err.message);
            }
          );
        return;
      }
      next();
    };
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      dataSource.ensureIndex('ion_files', {path: 1}).then(function () {resolve();}).catch(reject);
    });
  };
}

FsStorage.prototype = new ResourceStorage();

module.exports = FsStorage;
