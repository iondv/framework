/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

var DataPartModule = require('./DataPart');
var DataPart = DataPartModule.DataPart;

/**
 * @param {DataForSign} src
 * @constructor
 */
function DataForSigning(src) {
  this.parts = [];
  this.attributes = src.getAttributes();

  var prts = src.getParts();
  for (var i = 0; i < prts.length; i++) {
    this.parts[this.parts.length] = new DataPart(prts[i]);
  }

  this.toString = function() {
    return {parts: this.pats, attributes: this.attributes};
  };
}

module.export = DataForSigning;
