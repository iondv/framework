/**
 * Created by Данил on 03.08.2016.
 */

'use strict';

function IDigiSignModel() {
  /**
   * @param {String} action
   * @param {String} actor
   * @param {String} className
   * @param {String} objId
   * @param {String} attributes
   * @param {Byte[]} sign
   * @param {Byte[]} data
   * @param {Number} part
   * return {Promise}
   */
  this.addSign = function (action, actor, className, objId, attributes, sign, data, part) {
    return this._addSign(action, actor, className, objId, attributes, sign, data, part);
  };

  /**
   * @param {String} className
   * @param {String} objId
   * @param {String} action
   * @param {Date} since
   * @param {Date} till
   * return {Promise}
   */
  this.getSigns = function (className, objId, action, since, till) {
    return this._getSigns(className, objId, action, since, till);
  };
}

module.exports = IDigiSignModel;
