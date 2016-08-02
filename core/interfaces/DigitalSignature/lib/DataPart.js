/**
 * Created by Данил on 01.08.2016.
 */

'use strict';

var conv = require('binstring');

/**
 * @param {(String|Byte[])} c - contents
 * @param {String} mT - mimeType
 */
function DataPart(c, mT) {
  var _this = this;
  var mimeType = typeof mT !== 'undefined' ? mT : 'text/plain';
  var contents = typeof c === 'string' ? conv(c, {in: 'utf8', out: 'bytes'}) : Array.isArray(c) ? c : [];

  /**
   * @returns {String}
   */
  this.getMimeType = function () {
    return mimeType;
  };
  /**
   * @returns {Byte[]}
   */
  this.getContents = function () {
    return contents;
  };
  /**
   * @returns {String}
   */
  this.getString = function () {
    return conv(contents, {in: 'bytes', out: 'utf8'});
  };
}

module.exports = DataPart;
