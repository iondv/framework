/**
 * Created by Данил on 03.08.2016.
 */

'use strict';

var DigiSignCoreModule = require('core/interfaces/DigitalSignature');
var ISignedDataHandler = DigiSignCoreModule.ISignedDataHandler;
var conv = require('binstring');

/**
 * @param {IDigiSignModel} dsModel
 * @param {Function} authCallback
 * @constructor
 */
function SignedDataHandler(dsModel, authCallback) {
  var _this = this;

  /**
  * @param {String} itemId
  * @param {String} action
  * @param {Object} attributes
  * @param {(String|DataPart[])} data
  * @param {(String|String[])} signatures
  */
  this._process = function (itemId, action, attributes, data, signatures) {
    var ids = itemId.split('.');
    var className = ids[0];
    var objId = ids[1];
    var user = authCallback();

    this.processDataItem(className, objId);

    if (Array.isArray(signatures) && Array.isArray(data)) {
      var res = [];
      for (var i = 0; i < signatures.length; i++) {
        res[res.length] = this.saveSignature(user, className, objId, i, action, attributes,
          this.processSignature(attributes, data[i].getString(), signatures[i]),
          this.processSignedData(attributes, data[i].getString(), signatures[i]));
      }
      return Promise.all(res);
    } else if (typeof signatures === 'string' && typeof data === 'string') {
      return this.saveSignature(user, className, objId, 0, action, attributes,
        this.processSignature(attributes, data, signatures),
        this.processSignedData(attributes, data, signatures));
    } else {
      console.error('Inapropriate value');
    }
  };

  /**
   * @param {String} className
   * @param {String} id
   */
  this.processDataItem = function (className, id) {};
  /**
   * @param {Object} attributes
   * @param {String} data
   * @param {String} signature
   * @return {String}
   */
  this.processSignature = function (attributes, data, signature) {
    return signature;
  };
  /**
   * @param {Object} attributes
   * @param {String} data
   * @param {String} signature
   * @return {String}
   */
  this.processSignedData = function (attributes, data, signature) {
    return data;
  };
  /**
   * @param {String} uid
   * @param {String} className
   * @param {String} objId
   * @param {Number} index
   * @param {String} action
   * @param {Object} attributes
   * @param {String} signature
   * @param {String} data
   * @return {Promise}
   */
  this.saveSignature = function (uid, className, objId, index, action, attributes, signature, data) {
    return dsModel.addSign(action, uid, className, objId, index, JSON.stringify(attributes),
      conv(signature, {in: 'utf8', out: 'bytes'}),
      conv(data, {in: 'utf8', out: 'bytes'}));
  };
}

SignedDataHandler.prototype = new ISignedDataHandler();
module.exports = SignedDataHandler;
