/**
 * Created by Данил on 04.08.2016.
 */

'use strict';

/**
 * @param {Date} timeStamp
 * @param {String} action
 * @param {String} actor
 * @param {String} className
 * @param {Number} part
 * @param {String} objId
 * @param {String} attributes
 * @param {Byte[]} data
 * @param {Byte[]} sign
 * @constructor
 */
function DigitalSignature(timeStamp, action, actor, className, part, objId, attributes, data, sign) {
  /**
   * @type {Date}
   */
  this.timeStamp = timeStamp;
  /**
   * @type {String}
   */
  this.action = action;
  /**
   * @type {String}
   */
  this.actor = actor;
  /**
   * @type {String}
   */
  this.className = className;
  /**
   * @type {Number}
   */
  this.part = part;
  /**
   * @type {String}
   */
  this.objId = objId;
  /**
   * @type {String}
   */
  this.attributes = attributes;
  /**
   * @type {Byte[]}
   */
  this.data = data;
  /**
   * @type {Byte[]}
   */
  this.sign = sign;
}

module.exports = DigitalSignature;
