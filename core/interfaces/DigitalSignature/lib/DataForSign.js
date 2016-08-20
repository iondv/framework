/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

var DataPart = require('./DataPart');

/** *
 * @param {(DataPart[],DataPart)} p - parts
 * @param {Object} a - attributes
 * @constructor
 */
function DataForSign(p, a) {
  var parts = Array.isArray(p) ? p : p instanceof DataPart ? [p] : [];
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

  /**
   * @return {{Objects}}
     */
  this.getSerializable = function () {
    var result = {};
    result.parts = [];
    result.attributes = this.getAttributes();

    var prts = this.getParts();
    for (var i = 0; i < prts.length; i++) {
      result.parts[result.parts.length] = {mimeType: prts[i].getMimeType(), contents: prts[i].getString()};
    }

    return result;
  };
}

module.exports = DataForSign;
