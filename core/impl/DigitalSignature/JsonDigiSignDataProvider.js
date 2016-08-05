/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

var DigiSignCoreModule = require('core/interfaces/DigitalSignature');
var IDigiSignDataProvider = DigiSignCoreModule.IDigiSignDataProvider;
var DataForSign = DigiSignCoreModule.DataForSign;
var DataPart = DigiSignCoreModule.DataPart;
var conv = require('binstring');
var base64 = require('base64-js');

function JsonDigiSignDataProvider() {

  /**
   * @param {ClassMeta} c
   * @param {String} action
   * @returns {Boolean}
   */
  this._hasData = function (c, action) {
    return true;
  };
  /**
   *
   * @param {Item} item
   * @param {String} action
   * @returns {DataForSign}
   */
  this._getData = function (item, action) {
    var data = {};
    var props = item.getProperties();
    for (var p in props) {
      if (props.hasOwnProperty(p)) {
        data[p] = props[p].getString();
      }
    }
    return new DataForSign(new DataPart(base64.fromByteArray(conv(JSON.stringify(data), {out: 'bytes'}))), {});
  };
}

JsonDigiSignDataProvider.prototype = new IDigiSignDataProvider();
module.exports = JsonDigiSignDataProvider;
