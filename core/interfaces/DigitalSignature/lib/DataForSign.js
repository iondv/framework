/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

/** *
 * @param {(DataPart[],DataPart)} p - parts
 * @param {Object} a - attributes
 * @constructor
 */
function DataForSign(p, a) {
  var _this = this;
  var parts = Array.isArray(p) ? p : p instanceof 'DataPart' ? [p] : [];
  var attributes = typeof a === 'object' ? a : {};

  /**
   * @returns {Boolean}
   */
  this.isPartitioned = function () {
    return parts.length > 1;
  };
  /**
   * @returns {String|Null}
   */
  this.getMimeType = function () {
    if (parts.length > 0) {
      return parts[0].getMimeType();
    }
    return null;
  };
  /**
   * @returns {Byte[]}
   */
  this.getContents = function () {
    if (parts.length > 0) {
      return parts[0].getContents();
    }
    return null;
  };
  /**
   * @returns {String}
   */
  this.getString = function () {
    return this.toString();
  };
  /**
   * @returns {String}
   */
  this.toString = function () {
    var result = '';
    for (var i = 0; i < parts.length; i++) {
      result = result + parts[i].getString();
    }
    return result;
  };
  /**
   * @returns {DataPart[]}
   */
  this.getParts = function () {
    return parts;
  };
  /**
   * @returns {Object}
   */
  this.getAttributes = function () {
    return attributes;
  };
}

module.exports = DataForSign;
