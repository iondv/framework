/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

/**
 * @param {String} id
 * @param {String} action
 * @param {Object} attributes
 * @param {DataPart[]} parts
 * @param {String[]} signatures
 * @constructor
 */
function SignatureData(id, action, attributes, parts, signatures) {
  this.id = id;
  this.action = action;
  this.attributes = attributes;
  this.parts = parts;
  this.signatures = signatures;
}

module.exports = SignatureData;
