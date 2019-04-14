/**
 * Created by kras on 12.09.16.
 */
'use strict';

function DigitalSignManager() {
  /**
   * @param {Item} item
   * @param {String} action
   * @param {String} [preprocessor]
   * @returns {Promise}
   */
  this.signingAvailable = function (item, action, preprocessor) {
    return this._signingAvailable(item, action, preprocessor);
  };

  /**
   * @param {Item} item
   * @param {String} [action]
   * @param {String} [preprocessor]
   * @returns {Promise}
   */
  this.getDataForSigning = function (item, action, preprocessor) {
    return this._getDataForSigning(item, action, preprocessor);
  };

  /**
   * @param {String} id
   * @param {Buffer | Buffer[]} data
   * @param {Buffer | Buffer[]} signature
   * @param {{}} [attributes]
   * @returns {Promise}
   */
  this.persistSignature = function (id, data, signature, attributes) {
    return this._persistSignature(id, data, signature, attributes);
  };

  /**
   * @param {String} [id]
   * @param {Date} [since]
   * @param {Date} [till]
   * @param {{}} [options]
   * @param {Boolean} [options.asBase64]
   * @returns {Promise}
   */
  this.getSignatures = function (id, since, till, options) {
    return this._getSignatures(id, since, till, options);
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return this._init();
  };
}

module.exports = DigitalSignManager;
