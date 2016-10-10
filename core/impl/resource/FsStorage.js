/**
 * Created by kras on 14.07.16.
 */
'use strict';

var ResourceStorage = require('core/interfaces/ResourceStorage').ResourceStorage;
var StoredFile = require('core/interfaces/ResourceStorage').StoredFile;
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var cuid = require('cuid');
var merge = require('merge');
var clone = require('clone');
var mkdirp = require('mkdirp');

/* jshint maxcomplexity: 20, maxstatements: 30 */
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
  _options.storageBase = path.resolve(path.join(__dirname, '..', '..', '..'), _options.storageBase || './files');

  /**
   * @param {Buffer | String | {} | stream.Readable} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this._accept = function (data, options) {
    var opts = clone(options) || {};
    var m = moment();
    var pth = m.format('YYYY' + path.sep + 'MM' + path.sep + 'DD');
    switch (_options.fragmentation) {
      case 'hour':pth = path.join(pth, m.format('HH'));break;
      case 'minute':pth = path.join(pth, m.format('mm'));break;
    }

    var d;
    var fn;
    var id = cuid();

    if (typeof data === 'object' && (typeof data.originalname !== 'undefined' || typeof data.name !== 'undefined')) {
      fn = opts.name || data.originalname || data.name || id;
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
      fn = opts.name || id;
    }

    if (!d) {
      throw new Error('Переданы данные недопустимого типа!');
    }

    function checkDest(filename, prompt) {
      return new Promise(function (resolve, reject) {
        var result = path.join(_options.storageBase, pth, filename);
        fs.access(result, function (err, stats) {
          if (err) {
            resolve({path: pth, filename: filename});
            return;
          }
          var p = 1 + (prompt || 0);
          var lind = filename.lastIndexOf('.');
          var fn = lind > 0 ? filename.substring(0, lind) + p + filename.substring(lind) : filename + p;

          checkDest(fn, p).then(resolve).catch(reject);
        });
      });
    }

    return new Promise(function (resolve, reject) {
        checkDest(fn).then(function (check) {
          return new Promise(function (rs, rj) {
            mkdirp(path.join(_options.storageBase, check.path), function (err) {
              if (err) {
                rj(err);
              }

              var dest = path.join(_options.storageBase, check.path, check.filename);

              if (typeof d === 'string' || typeof d.pipe === 'function') {
                var writer, reader;
                writer = fs.createWriteStream(dest);
                reader = d;
                if (typeof d === 'string') {
                  reader = fs.createReadStream(d);
                }
                writer.on('error', rj);
                writer.on('finish', function () {
                  rs(dest);
                });
                reader.pipe(writer);
              } else {
                fs.writeFile(dest, d, function (err) {
                  if (err) {
                    rj(err);
                  }
                  rs(path.join(check.path, check.filename));
                });
              }
            });
          });
        }).then(function (pth) { // TODO ОПределять mime-type и content-type
          return dataSource.insert('ion_files', {id: id, path: pth, options: opts});
        }).then(function (r) {
          resolve(r.id);
        }).catch(reject);
      });
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._remove = function (id) {
    return new Promise(function (resolve, reject) {
      dataSource.get('ion_files', {id: id}).
      then(function (file) {
        if (file) {
          var result = path.join(_options.storageBase, file.path);
          fs.unlink(result, function (err) {
            if (err) {
              reject(err);
            }
            dataSource.delete('ion_files', {id: id})
              .then(resolve)
              .catch(reject);
          });
        } else {
          resolve();
        }
      }).
      catch(reject);
    });
  };

  function streamGetter(file) {
    return function () {
      return fs.createReadStream(path.join(_options.storageBase, file.path));
    };
  }

  /**
   * @param {String[]} ids
   * @returns {Promise}
   */
  this._fetch = function (ids) {
    return new Promise(function (resolve, reject) {
      dataSource.fetch('ion_files', {filter: {id: {$in: ids}}}).
      then(function (files) {
        var result = [];
        for (var i = 0; i < files.length; i++) {
          result.push(
            new StoredFile(
              files[i].id,
              _options.urlBase + '/' + files[i].id,
              files[i].options,
              streamGetter(files[i])
            )
          );
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
      if (req.path.indexOf(_options.urlBase) !== 0) {
        return next();
      }

      var fileId = req.path.replace(_options.urlBase + '/', '');

      if (!fileId) {
        return next();
      }

      _this._fetch([fileId])
        .then(
          function (data) {
            if (data.length > 0) {
              return data[0].getContents();
            }
            return null;
          }
        ).then(
          function (file) {
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
          }
        )
        .catch(
          function (err) {
            res.status(500).send(err.message);
          }
        );
    };
  };

  /**
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      dataSource.ensureIndex('ion_files', {id: 1}, {unique: true})
        .then(function () { return dataSource.ensureIndex('ion_files', {path: 1}); })
        .then(function () {resolve();})
        .catch(reject);
    });
  };
}

FsStorage.prototype = new ResourceStorage();

module.exports = FsStorage;
