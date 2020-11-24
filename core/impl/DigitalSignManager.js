/**
 * Created by kras on 12.09.16.
 */
'use strict';

const IDigitalSignManager = require('core/interfaces/DigitalSignManager');
const Preprocessor = require('core/interfaces/Preprocessor');
const base64 = require('base64-js');
const buf = require('core/buffer');
const F = require('core/FunctionCodes');
const {t} = require('core/i18n');

// jshint maxcomplexity: 20

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @param {Preprocessor} [options.Preprocessor]
 * @param {{}} [options.preprocessors]
 * @param {Boolean} [options.defaultResult]
 * @param {{processSignature: Function}} [options.signaturePreprocessor]
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
   * @param {String} [preprocessor]
   * @returns {Promise}
   */
  this._signingAvailable = function (item, action, preprocessor) {
    let p = getPreprocessor(preprocessor);
    if (p) {
      return p.applicable(item, {action: action});
    }
    return Promise.resolve(options.defaultResult ? true : false);
  };

  /**
   * @param {Item} item
   * @param {String} [action]
   * @param {String} [preprocessor]
   * @returns {Promise}
   */
  this._getDataForSigning = function (item, action, preprocessor) {
    let p = getPreprocessor(preprocessor);
    if (p) {
      return p.process(item, {action: action});
    }

    if (options.defaultResult) {
      return Promise.resolve(
        {
          mimeType: 'application/json',
          content: buf(JSON.stringify(item.base), 'utf-8')
        }
      );
    }

    return Promise.resolve(null);
  };

  /**
   * @param {String} id
   * @param {{mimeType: String, content: Buffer | String} | {mimeType: String, content: Buffer | String}[]} data
   * @param {Buffer | Buffer[] | String | String[] } signature
   * @param {{}} [attributes]
   * @returns {Promise}
   */
  this._persistSignature = function (id, data, signature, attributes) {
    if (!options.dataSource) {
        throw new Error(t('Datasource is not set up.'));
    }

    if (Array.isArray(signature)) {
      for (let i = 0; i < signature.length; i++) {
        if (typeof signature[i] !== 'string') {
          signature[i] = base64.fromByteArray(signature[i]);
        }
      }
    } else {
      if (typeof signature !== 'string') {
        signature = base64.fromByteArray(signature);
      }
    }

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i].content !== 'string') {
          data[i].content = base64.fromByteArray(data[i].content);
        }
      }
    } else {
      if (typeof data.content !== 'string') {
        data.content = base64.fromByteArray(data.content);
      }
    }

    let pp;

    if (options.signaturePreprocessor &&
      typeof options.signaturePreprocessor.processSignature === 'function') {
      pp = options.signaturePreprocessor.processSignature(attributes, signature, data);
    } else {
      pp = Promise.resolve(signature);
    }

    return pp
      .then((signature) => {
        return options.dataSource.insert('ion_signatures',
            {
              id: id,
              timeStamp: new Date(),
              signature: signature,
              data: data,
              attributes: attributes || {}
            }
          );
        }
      )
      .then((result) => {
        return {
          id: result.id,
          timeStamp: result.timeStamp
        };
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
    if (!options.dataSource) {
      throw new Error(t('Datasource is not set up.'));
    }

    let and = [];

    if (id) {
      and.push({[F.EQUAL]: ['$id', id]});
    }

    if (since && till) {
      and.push({
        [F.AND]: [
          {[F.GREATER_OR_EQUAL]: ['$timeStamp', since]},
          {[F.LESS_OR_EQUAL]: ['$timeStamp', till]}
        ]
      });
    } else if (since) {
      and.push({[F.GREATER_OR_EQUAL]: ['$timeStamp', since]});
    }

    if (!and.length) {
      throw new Error(t('Fetch parameters are not specified!'));
    }

    return options.dataSource.fetch('ion_signatures',
        {
          filter: and.length > 1 ? {[F.AND]: and} : and[0],
          sort: {timeStamp: 1}
        }
      )
      .then(
        (signatures) => {
          let result = [];
          for (let i = 0; i < signatures.length; i++) {
            let sign, data;
            if (!opts.asBase64) {
              if (Array.isArray(signatures[i].signature)) {
                sign = [];
                signatures[i].signature.forEach((sig) => sign.push(base64.toByteArray(sig)));
              } else if (typeof signatures[i].signature === 'string') {
                sign = base64.toByteArray(signatures[i].signature);
              }

              if (Array.isArray(signatures[i].data)) {
                data = [];
                signatures[i].data.forEach((dt) => data.push({
                  mimeType: dt.mimeType,
                  content: base64.toByteArray(dt.content)
                }));
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

          return result;
        }
      );
  };

  /**
   * @private
   * @returns {Promise}
   */
  this._init = function () {
    return options.dataSource.ensureIndex('ion_signatures', [{id: 1}, {timeStamp: 1}], {unique: true});
  };
}

DigitalSignManager.prototype = new IDigitalSignManager();
module.exports = DigitalSignManager;
