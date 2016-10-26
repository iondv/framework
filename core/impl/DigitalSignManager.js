/**
 * Created by kras on 12.09.16.
 */
'use strict';

const IDigitalSignManager = require('core/interfaces/DigitalSignManager');
const Preprocessor = require('core/interfaces/Preprocessor');
const base64 = require('base64-js');
const buf = require('core/buffer');

// jshint maxcomplexity: 20

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {Preprocessor} [options.Preprocessor]
 * @param {{}} [options.preprocessors]
 * @param {Boolean} [options.defaultResult]
 * @constructor
 */
function DigitalSignManager(options) {
  /**
   * @param {String} nm
   * @returns {Preprocessor | null}
   */
  function getPreprocessor(nm) {
    if (nm && options.preprocessors &&
      typeof options.preprocessors[nm] instanceof Preprocessor) {
      return options.preprocessors[nm];
    }

    if (options.Preprocessor instanceof Preprocessor) {
      return options.Preprocessor;
    }

    return null;
  }

  /**
   * @param {Item} item
   * @param {String} action
   * @param {String} preprocessor
   * @returns {Promise}
   */
  this._signingAvailable = function (item, action, preprocessor) {
    return new Promise(function (resolve, reject) {
      var p = getPreprocessor(preprocessor);
      if (p) {
        return p.applicable(item, {action: action}).then(resolve).catch(reject);
      }

      resolve(options.defaultResult);
    });
  };

  /**
   * @param {Item} item
   * @param {String} [action]
   * @param {String} [preprocessor]
   * @returns {Promise}
   */
  this._getDataForSigning = function (item, action, preprocessor) {
    return new Promise(function (resolve, reject) {
      var p = getPreprocessor(preprocessor);
      if (p) {
        return p.process(item, {action: action}).then(resolve).catch(reject);
      }

      if (options.defaultResult) {
        return resolve(
          {
            mimeType: 'application/json',
            content: buf(JSON.stringify(item.base), 'utf-8')
          }
        );
      }

      resolve(null);
    });
  };

  /**
   * @param {String} id
   * @param {{mimeType: String, content: Buffer | String} | {mimeType: String, content: Buffer | String}[]} data
   * @param {Buffer | Buffer[] | String | String[] } signature
   * @param {{}} [attributes]
   * @returns {Promise}
   */
  this._persistSignature = function (id, data, signature, attributes) {
    return new Promise(function (resolve, reject) {
      var i;
      if (!options.dataSource) {
        reject(new Error('Не настроен источник данных.'));
      }

      if (Array.isArray(signature)) {
        for (i = 0; i < signature.length; i++) {
          if (typeof signature[i] !== 'string') {
            signature[i] = base64.fromByteArray(signature[i]);
          }
        }
      } else {
        if (typeof signature[i] !== 'string') {
          signature = base64.fromByteArray(signature);
        }
      }

      if (Array.isArray(data)) {
        for (i = 0; i < data.length; i++) {
          if (typeof data[i].content !== 'string') {
            data[i].content = base64.fromByteArray(data[i].content);
          }
        }
      } else {
        if (typeof data.content !== 'string') {
          data.content = base64.fromByteArray(data.content);
        }
      }

      options.dataSource.insert('ion_signatures',
        {
          id: id,
          timeStamp: new Date(),
          signature: signature,
          data: data,
          attributes: attributes || {}
        }
      ).then(function (result) {
        resolve({
          id: result.id,
          timeStamp: result.timeStamp
        });
      }).catch(reject);
    });
  };

  /**
   * @param {String} [id]
   * @param {Date} [since]
   * @param {Date} [till]
   * @param {{}} opts
   * @param {Boolean} [opts.asBase64]
   * @returns {Promise}
   */
  this._getSignatures = function (id, since, till, opts) {
    return new Promise(function (resolve, reject) {
      if (!options.dataSource) {
        reject(new Error('Не настроен источник данных.'));
      }

      var and = [];

      if (id) {
        and.push({id: id});
      }

      if (since && till) {
        and.push({
          $and: [
            {timeStamp: {$gte: since}},
            {timeStamp: {$lte: till}}
          ]
        });
      } else if (since) {
        and.push({timeStamp: since});
      }

      if (!and.length) {
        reject('Не указаны параметры выборки!');
      }

      options.dataSource.fetch('ion_signatures',
        {
          filter: and.length > 1 ? {$and: and} : and[0],
          sort: {timeStamp: 1}
        }
      ).
      then(
        function (signatures) {
          var result = [];
          var sign, data, i;
          for (i = 0; i < signatures.length; i++) {
            if (!opts.asBase64) {
              if (Array.isArray(signatures[i].signature)) {
                sign = [];
                for (i = 0; i < signatures[i].signature.length; i++) {
                  sign.push(base64.toByteArray(signatures[i].signature[i]));
                }
              } else if (typeof signatures[i].signature === 'string') {
                sign = base64.toByteArray(signatures[i].signature);
              }

              if (Array.isArray(signatures[i].data)) {
                data = [];
                for (i = 0; i < signatures[i].data.length; i++) {
                  data.push({
                    mimeType: signatures[i].data[i].mimeType,
                    content: base64.toByteArray(signatures[i].data[i].content)
                  });
                }
              } else if (typeof signatures[i].signature === 'string') {
                data = {
                  mimeType: signatures[i].data.mimeType,
                  content: base64.toByteArray(signatures[i].data.content)
                };
              }
            } else {
              sign = signatures[i].signature;
              data = signatures[i].data;
            }

            result.push(
              {
                id: signatures[i].id,
                timeStamp: signatures[i].timeStamp,
                attributes: signatures[i].attributes,
                signature: sign,
                data: data
              }
            );
          }

          resolve(result);
        }
      ).
      catch(reject);
    });
  };

  /**
   * @private
   * @returns {Promise}
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      options.dataSource.ensureIndex('ion_signatures', [{id: 1}, {timeStamp: 1}], {unique: true}).
      then(resolve).
      catch(reject);
    });
  };
}

DigitalSignManager.prototype = new IDigitalSignManager();
module.exports = DigitalSignManager;
